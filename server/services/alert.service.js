const pool = require('../config/db');
const { NotFoundError } = require('../utils/errors');
const config = require('../config/env');

async function getAlerts() {
    const [alerts] = await pool.query(`
        SELECT ca.session_id, s.title as session_title, e.name as event_name, s.capacity,
        (SELECT COUNT(*) FROM registrations r WHERE r.session_id = s.id AND r.status IN ('reserved', 'confirmed', 'checked_in')) as active_registration_count
        FROM capacity_alerts ca
        JOIN sessions s ON ca.session_id = s.id
        JOIN events e ON s.event_id = e.id
        WHERE ca.is_dismissed = FALSE
    `);
    return alerts;
}

async function getAlertCount() {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM capacity_alerts WHERE is_dismissed = FALSE');
    return count;
}

async function dismissAlert(sessionId) {
    const [result] = await pool.query(
        'UPDATE capacity_alerts SET is_dismissed = TRUE WHERE session_id = ? AND is_dismissed = FALSE',
        [sessionId]
    );
    if (result.affectedRows === 0) {
        throw new NotFoundError('Alert not found or already dismissed');
    }
}

async function checkAndCreateAlert(sessionId, connection = pool) {
    const [[session]] = await connection.query('SELECT capacity FROM sessions WHERE id = ?', [sessionId]);
    if (!session) return;
    
    const holdMinutes = config.reservationHoldMinutes || 15;
    
    const [[{ active_count }]] = await connection.query(`
        SELECT COUNT(*) as active_count
        FROM registrations
        WHERE session_id = ?
        AND (
            status IN ('confirmed', 'checked_in')
            OR (status = 'reserved' AND reserved_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE))
        )
    `, [sessionId, holdMinutes]);

    if (active_count >= session.capacity) {
        await connection.query(`
            INSERT INTO capacity_alerts (session_id, is_dismissed)
            VALUES (?, FALSE)
            ON DUPLICATE KEY UPDATE is_dismissed = FALSE
        `, [sessionId]);
    }
}

module.exports = {
    getAlerts,
    getAlertCount,
    dismissAlert,
    checkAndCreateAlert
};
