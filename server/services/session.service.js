const pool = require('../config/db');
const { NotFoundError } = require('../utils/errors');
const config = require('../config/env');

async function listSessions(eventId) {
    const holdMinutes = config.reservationHoldMinutes;
    
    // Check if event exists
    const [eventRows] = await pool.query('SELECT 1 FROM events WHERE id = ?', [eventId]);
    if (eventRows.length === 0) {
        throw new NotFoundError('Event not found');
    }

    const [sessions] = await pool.query(
        `SELECT s.*, 
            (SELECT COUNT(*) FROM registrations r 
             WHERE r.session_id = s.id 
             AND r.status IN ('reserved','confirmed','checked_in') 
             AND NOT (r.status = 'reserved' AND r.reserved_at < NOW() - INTERVAL ? MINUTE)
            ) AS occupiedCount
         FROM sessions s
         WHERE s.event_id = ?
         ORDER BY s.start_time ASC`,
        [holdMinutes, eventId]
    );

    return sessions;
}

async function getSessionById(id) {
    const holdMinutes = config.reservationHoldMinutes;

    const [rows] = await pool.query(
        `SELECT s.*, e.name as event_name, e.start_date as event_start_date, e.venue as event_venue
         FROM sessions s
         JOIN events e ON s.event_id = e.id
         WHERE s.id = ?`,
        [id]
    );

    const session = rows[0];
    if (!session) {
        throw new NotFoundError('Session not found');
    }

    // counts by status
    const [statusRows] = await pool.query(
        `SELECT status, COUNT(*) as count 
         FROM registrations 
         WHERE session_id = ? 
         GROUP BY status`,
        [id]
    );

    const totalByStatus = {};
    for (const row of statusRows) {
        totalByStatus[row.status] = row.count;
    }

    const [activeRows] = await pool.query(
        `SELECT COUNT(*) as activeCount 
         FROM registrations 
         WHERE session_id = ? 
         AND status IN ('reserved','confirmed','checked_in') 
         AND NOT (status = 'reserved' AND reserved_at < NOW() - INTERVAL ? MINUTE)`,
        [id, holdMinutes]
    );

    session.occupiedCount = activeRows[0].activeCount;
    session.totalByStatus = totalByStatus;

    return session;
}

async function createSession(data) {
    const { eventId, title, startTime, durationMinutes, location, capacity } = data;
    
    // Verify event exists
    const [eventRows] = await pool.query('SELECT 1 FROM events WHERE id = ?', [eventId]);
    if (eventRows.length === 0) {
        throw new NotFoundError('Event not found');
    }

    const [result] = await pool.query(
        `INSERT INTO sessions (event_id, title, start_time, duration_minutes, location, capacity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [eventId, title, startTime, durationMinutes, location, capacity]
    );

    return getSessionById(result.insertId);
}

async function updateSession(id, data) {
    const { title, startTime, durationMinutes, location, capacity } = data;

    // Verify exists
    const [rows] = await pool.query('SELECT 1 FROM sessions WHERE id = ?', [id]);
    if (rows.length === 0) {
        throw new NotFoundError('Session not found');
    }

    await pool.query(
        `UPDATE sessions 
         SET title = ?, start_time = ?, duration_minutes = ?, location = ?, capacity = ?
         WHERE id = ?`,
        [title, startTime, durationMinutes, location, capacity, id]
    );

    return getSessionById(id);
}

async function deleteSession(id) {
    // Verify exists
    const [rows] = await pool.query('SELECT 1 FROM sessions WHERE id = ?', [id]);
    if (rows.length === 0) {
        throw new NotFoundError('Session not found');
    }

    await pool.query('DELETE FROM sessions WHERE id = ?', [id]);
}

module.exports = {
    listSessions,
    getSessionById,
    createSession,
    updateSession,
    deleteSession
};
