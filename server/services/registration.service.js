// ============================================================
// registration.service.js — Core registration lifecycle
// Pessimistic locking, state machine, auto-expiry, audit trail
// ============================================================

const pool = require('../config/db');
const config = require('../config/env');
const { NotFoundError, ValidationError } = require('../utils/errors');

// ── State Machine ──────────────────────────────────────────
const VALID_TRANSITIONS = {
    reserved:  ['confirmed', 'cancelled'],
    confirmed: ['checked_in', 'cancelled']
    // checked_in, cancelled, expired are terminal states
};

const TIMESTAMP_COLUMNS = {
    confirmed:  'confirmed_at',
    checked_in: 'checked_in_at',
    cancelled:  'cancelled_at',
    expired:    'expired_at'
};

// ── Active seat count (excludes stale reservations) ────────
async function getActiveCount(sessionId, conn) {
    const db = conn || pool;
    const holdMinutes = config.reservationHoldMinutes;
    const [rows] = await db.query(
        `SELECT COUNT(*) AS occupied FROM registrations
         WHERE session_id = ?
           AND status IN ('reserved', 'confirmed', 'checked_in')
           AND NOT (status = 'reserved' AND reserved_at < NOW() - INTERVAL ? MINUTE)`,
        [sessionId, holdMinutes]
    );
    return rows[0].occupied;
}

// ── Create Registration (with pessimistic locking) ─────────
async function createRegistration({ sessionId, attendeeName, attendeeEmail, createdBy }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Lock the session row
        const [sessions] = await conn.query(
            'SELECT id, capacity FROM sessions WHERE id = ? FOR UPDATE',
            [sessionId]
        );
        if (sessions.length === 0) {
            throw new NotFoundError('Session not found');
        }
        const capacity = sessions[0].capacity;

        // 2. Count active seats
        const occupied = await getActiveCount(sessionId, conn);

        // 3. Check for existing registration with same email
        const [existing] = await conn.query(
            'SELECT id, status FROM registrations WHERE session_id = ? AND attendee_email = ?',
            [sessionId, attendeeEmail]
        );

        let registrationId;

        if (existing.length > 0) {
            const reg = existing[0];
            if (['reserved', 'confirmed', 'checked_in'].includes(reg.status)) {
                // Check if it's a stale reservation
                if (reg.status === 'reserved') {
                    const [staleCheck] = await conn.query(
                        `SELECT id FROM registrations WHERE id = ? AND status = 'reserved'
                         AND reserved_at < NOW() - INTERVAL ? MINUTE`,
                        [reg.id, config.reservationHoldMinutes]
                    );
                    if (staleCheck.length === 0) {
                        throw new ValidationError('This email is already registered for this session');
                    }
                    // It's stale — treat as expired, fall through to re-register
                } else {
                    throw new ValidationError('This email is already registered for this session');
                }
            }

            // Re-register (previous was cancelled, expired, or stale)
            if (occupied >= capacity) {
                throw new ValidationError('Session is full — no seats available');
            }

            await conn.query(
                `UPDATE registrations
                 SET status = 'reserved', attendee_name = ?, reserved_at = NOW(),
                     confirmed_at = NULL, checked_in_at = NULL, cancelled_at = NULL, expired_at = NULL,
                     created_by = ?
                 WHERE id = ?`,
                [attendeeName, createdBy, reg.id]
            );
            registrationId = reg.id;
        } else {
            // New registration
            if (occupied >= capacity) {
                throw new ValidationError('Session is full — no seats available');
            }

            const [result] = await conn.query(
                `INSERT INTO registrations (session_id, attendee_name, attendee_email, status, reserved_at, created_by)
                 VALUES (?, ?, ?, 'reserved', NOW(), ?)`,
                [sessionId, attendeeName, attendeeEmail, createdBy]
            );
            registrationId = result.insertId;
        }

        // 4. Audit trail
        await conn.query(
            `INSERT INTO registration_timeline (registration_id, action, new_status, performed_by)
             VALUES (?, 'created', 'reserved', ?)`,
            [registrationId, createdBy]
        );

        // 5. Capacity alert check
        const newOccupied = occupied + 1;
        if (newOccupied >= capacity) {
            await conn.query(
                `INSERT INTO capacity_alerts (session_id) VALUES (?)
                 ON DUPLICATE KEY UPDATE is_dismissed = FALSE, updated_at = NOW()`,
                [sessionId]
            );
        }

        await conn.commit();
        return getRegistrationById(registrationId);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ── Generic State Transition ───────────────────────────────
async function transitionStatus(id, newStatus, performedBy) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Lock the registration row
        const [rows] = await conn.query(
            'SELECT * FROM registrations WHERE id = ? FOR UPDATE',
            [id]
        );
        if (rows.length === 0) {
            throw new NotFoundError('Registration not found');
        }

        const reg = rows[0];
        let currentStatus = reg.status;

        // Handle stale reserved → treat as expired
        if (currentStatus === 'reserved') {
            const [staleCheck] = await conn.query(
                `SELECT id FROM registrations WHERE id = ? AND status = 'reserved'
                 AND reserved_at < NOW() - INTERVAL ? MINUTE`,
                [id, config.reservationHoldMinutes]
            );
            if (staleCheck.length > 0) {
                // Mark as expired first
                await conn.query(
                    `UPDATE registrations SET status = 'expired', expired_at = NOW() WHERE id = ?`,
                    [id]
                );
                await conn.query(
                    `INSERT INTO registration_timeline (registration_id, action, old_status, new_status, performed_by)
                     VALUES (?, 'status_change', 'reserved', 'expired', NULL)`,
                    [id]
                );
                currentStatus = 'expired';
            }
        }

        // Validate transition
        const allowed = VALID_TRANSITIONS[currentStatus];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new ValidationError(
                `Cannot transition from '${currentStatus}' to '${newStatus}'. ` +
                (allowed ? `Allowed: ${allowed.join(', ')}` : `'${currentStatus}' is a terminal state.`)
            );
        }

        // Perform the transition
        const tsCol = TIMESTAMP_COLUMNS[newStatus];
        await conn.query(
            `UPDATE registrations SET status = ?, ${tsCol} = NOW() WHERE id = ?`,
            [newStatus, id]
        );

        // Audit trail
        await conn.query(
            `INSERT INTO registration_timeline (registration_id, action, old_status, new_status, performed_by)
             VALUES (?, 'status_change', ?, ?, ?)`,
            [id, currentStatus, newStatus, performedBy]
        );

        // Capacity alert check after confirm/check-in
        if (newStatus === 'confirmed' || newStatus === 'checked_in') {
            const occupied = await getActiveCount(reg.session_id, conn);
            const [sesRows] = await conn.query('SELECT capacity FROM sessions WHERE id = ?', [reg.session_id]);
            if (sesRows.length > 0 && occupied >= sesRows[0].capacity) {
                await conn.query(
                    `INSERT INTO capacity_alerts (session_id) VALUES (?)
                     ON DUPLICATE KEY UPDATE is_dismissed = FALSE, updated_at = NOW()`,
                    [reg.session_id]
                );
            }
        }

        await conn.commit();
        return getRegistrationById(id);
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ── Convenience transition methods ─────────────────────────
async function confirmRegistration(id, performedBy) {
    return transitionStatus(id, 'confirmed', performedBy);
}

async function cancelRegistration(id, performedBy) {
    return transitionStatus(id, 'cancelled', performedBy);
}

async function checkInRegistration(id, performedBy) {
    return transitionStatus(id, 'checked_in', performedBy);
}

// ── Get Registration by ID (with timeline) ─────────────────
async function getRegistrationById(id) {
    const [rows] = await pool.query(
        `SELECT r.*, s.title AS session_title, s.capacity, s.event_id,
                e.name AS event_name
         FROM registrations r
         JOIN sessions s ON r.session_id = s.id
         JOIN events e ON s.event_id = e.id
         WHERE r.id = ?`,
        [id]
    );
    if (rows.length === 0) {
        throw new NotFoundError('Registration not found');
    }

    const [timeline] = await pool.query(
        `SELECT t.*, u.name AS performed_by_name
         FROM registration_timeline t
         LEFT JOIN users u ON t.performed_by = u.id
         WHERE t.registration_id = ?
         ORDER BY t.performed_at ASC`,
        [id]
    );

    return { ...rows[0], timeline };
}

// ── List Registrations (search, filter, sort, paginate) ────
async function listRegistrations({ sessionId, search, status, sort, order, page = 1, limit = 20, userId } = {}) {
    let where = ['1=1'];
    let params = [];
    const holdMinutes = config.reservationHoldMinutes;

    // Staff can only see their assigned sessions
    if (userId) {
        where.push('r.session_id IN (SELECT session_id FROM staff_assignments WHERE user_id = ?)');
        params.push(userId);
    }

    if (sessionId) {
        where.push('r.session_id = ?');
        params.push(sessionId);
    }

    if (search) {
        where.push('(r.attendee_name LIKE ? OR r.attendee_email LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
        if (status === 'expired') {
            // Include both db-expired and stale reserved
            where.push(`(r.status = 'expired' OR (r.status = 'reserved' AND r.reserved_at < NOW() - INTERVAL ? MINUTE))`);
            params.push(holdMinutes);
        } else if (status === 'reserved') {
            where.push(`r.status = 'reserved' AND NOT (r.reserved_at < NOW() - INTERVAL ? MINUTE)`);
            params.push(holdMinutes);
        } else {
            where.push('r.status = ?');
            params.push(status);
        }
    }

    const whereClause = where.join(' AND ');

    // Validate sort column
    const validSorts = ['attendee_name', 'attendee_email', 'status', 'reserved_at', 'created_at'];
    const sortCol = validSorts.includes(sort) ? `r.${sort}` : 'r.reserved_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    // Count total
    const [countRows] = await pool.query(
        `SELECT COUNT(*) AS total FROM registrations r WHERE ${whereClause}`,
        params
    );
    const total = countRows[0].total;

    // Fetch page
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
        `SELECT r.*, s.title AS session_title, e.name AS event_name
         FROM registrations r
         JOIN sessions s ON r.session_id = s.id
         JOIN events e ON s.event_id = e.id
         WHERE ${whereClause}
         ORDER BY ${sortCol} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        registrations: rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
}

// ── Add Note ───────────────────────────────────────────────
async function addNote(id, note, performedBy) {
    // Verify registration exists
    const [rows] = await pool.query('SELECT id FROM registrations WHERE id = ?', [id]);
    if (rows.length === 0) {
        throw new NotFoundError('Registration not found');
    }

    const [result] = await pool.query(
        `INSERT INTO registration_timeline (registration_id, action, note, performed_by)
         VALUES (?, 'note_added', ?, ?)`,
        [id, note, performedBy]
    );

    const [entry] = await pool.query(
        `SELECT t.*, u.name AS performed_by_name
         FROM registration_timeline t
         LEFT JOIN users u ON t.performed_by = u.id
         WHERE t.id = ?`,
        [result.insertId]
    );

    return entry[0];
}

module.exports = {
    getActiveCount,
    createRegistration,
    confirmRegistration,
    cancelRegistration,
    checkInRegistration,
    getRegistrationById,
    listRegistrations,
    addNote
};
