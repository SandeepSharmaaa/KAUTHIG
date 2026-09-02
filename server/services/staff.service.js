const pool = require('../config/db');
const { NotFoundError, ValidationError } = require('../utils/errors');
const config = require('../config/env');

async function listStaff(sessionId) {
    const [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM users u
         JOIN staff_assignments sa ON u.id = sa.user_id
         WHERE sa.session_id = ?`,
        [sessionId]
    );
    return rows;
}

async function assignStaff(sessionId, userId) {
    // Verify session exists
    const [sessions] = await pool.query('SELECT 1 FROM sessions WHERE id = ?', [sessionId]);
    if (sessions.length === 0) {
        throw new NotFoundError('Session not found');
    }

    // Verify user exists and role is check_in_staff
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
        throw new NotFoundError('User not found');
    }
    if (users[0].role !== 'check_in_staff') {
        throw new ValidationError('User must have check_in_staff role to be assigned');
    }

    try {
        await pool.query(
            'INSERT INTO staff_assignments (session_id, user_id) VALUES (?, ?)',
            [sessionId, userId]
        );
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new ValidationError('User is already assigned to this session');
        }
        throw error;
    }
}

async function removeStaff(sessionId, userId) {
    const [result] = await pool.query(
        'DELETE FROM staff_assignments WHERE session_id = ? AND user_id = ?',
        [sessionId, userId]
    );

    if (result.affectedRows === 0) {
        throw new NotFoundError('Assignment not found');
    }
}

async function getMyAssignments(userId) {
    const holdMinutes = config.reservationHoldMinutes;
    const [rows] = await pool.query(
        `SELECT s.*, e.name as event_name, e.start_date as event_start_date,
            (SELECT COUNT(*) FROM registrations r 
             WHERE r.session_id = s.id 
             AND r.status IN ('reserved','confirmed','checked_in') 
             AND NOT (r.status = 'reserved' AND r.reserved_at < NOW() - INTERVAL ? MINUTE)
            ) AS active_registration_count
         FROM sessions s
         JOIN staff_assignments sa ON s.id = sa.session_id
         JOIN events e ON s.event_id = e.id
         WHERE sa.user_id = ?
         ORDER BY s.start_time ASC`,
        [holdMinutes, userId]
    );
    return rows;
}

module.exports = {
    listStaff,
    assignStaff,
    removeStaff,
    getMyAssignments
};
