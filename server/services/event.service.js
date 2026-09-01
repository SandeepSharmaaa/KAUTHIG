const pool = require('../config/db');
const { NotFoundError } = require('../utils/errors');

async function listEvents({ includeArchived = false } = {}) {
    const query = includeArchived
        ? 'SELECT * FROM events ORDER BY start_date DESC'
        : 'SELECT * FROM events WHERE is_archived = FALSE ORDER BY start_date DESC';
    const [rows] = await pool.query(query);
    return rows;
}

async function getEventById(id) {
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    const event = rows[0];
    if (!event) {
        throw new NotFoundError('Event not found');
    }

    const [sessions] = await pool.query(
        'SELECT * FROM sessions WHERE event_id = ? ORDER BY start_time ASC',
        [id]
    );

    return { ...event, sessions };
}

async function createEvent({ name, description, startDate, endDate, venue, createdBy }) {
    const [result] = await pool.query(
        `INSERT INTO events (name, description, start_date, end_date, venue, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, startDate, endDate, venue, createdBy]
    );
    return getEventById(result.insertId);
}

async function updateEvent(id, { name, description, startDate, endDate, venue }) {
    await getEventById(id);

    await pool.query(
        `UPDATE events SET name = ?, description = ?, start_date = ?, end_date = ?, venue = ?
         WHERE id = ?`,
        [name, description, startDate, endDate, venue, id]
    );

    return getEventById(id);
}

async function setArchiveStatus(id, isArchived) {
    await getEventById(id);
    await pool.query('UPDATE events SET is_archived = ? WHERE id = ?', [isArchived, id]);
    return getEventById(id);
}

module.exports = {
    listEvents,
    getEventById,
    createEvent,
    updateEvent,
    setArchiveStatus
};