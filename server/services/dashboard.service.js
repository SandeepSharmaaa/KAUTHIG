const pool = require('../config/db');

async function getDashboardData(user) {
    const [[{ totalEvents }]] = await pool.query('SELECT COUNT(*) as totalEvents FROM events WHERE is_archived = FALSE');
    const [[{ totalSessions }]] = await pool.query('SELECT COUNT(*) as totalSessions FROM sessions');
    const [[{ sessionsToday }]] = await pool.query('SELECT COUNT(*) as sessionsToday FROM sessions WHERE DATE(start_time) = CURDATE()');
    const [[{ checkedInToday }]] = await pool.query("SELECT COUNT(*) as checkedInToday FROM registrations WHERE status = 'checked_in' AND DATE(checked_in_at) = CURDATE()");
    const [[{ totalRegistrations }]] = await pool.query('SELECT COUNT(*) as totalRegistrations FROM registrations');
    const [[{ expiredThisWeek }]] = await pool.query("SELECT COUNT(*) as expiredThisWeek FROM registrations WHERE status = 'expired' AND expired_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
    
    const [[{ sessionsAtCapacity }]] = await pool.query(`
        SELECT COUNT(*) as sessionsAtCapacity
        FROM sessions s
        JOIN (
            SELECT session_id, COUNT(*) as active_count
            FROM registrations
            WHERE status IN ('reserved', 'confirmed', 'checked_in')
            GROUP BY session_id
        ) r ON s.id = r.session_id
        WHERE r.active_count >= s.capacity
    `);

    const stats = {
        totalEvents,
        totalSessions,
        sessionsToday,
        checkedInToday,
        totalRegistrations,
        expiredThisWeek,
        sessionsAtCapacity
    };

    const [registrationsByStatus] = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM registrations
        GROUP BY status
    `);

    const [registrationsBySession] = await pool.query(`
        SELECT s.title as sessionTitle, e.name as eventName, COUNT(r.id) as total, s.capacity
        FROM sessions s
        JOIN events e ON s.event_id = e.id
        LEFT JOIN registrations r ON s.id = r.session_id
        GROUP BY s.id
        ORDER BY total DESC
        LIMIT 10
    `);

    const [checkInsData] = await pool.query(`
        SELECT DATE(checked_in_at) as date, COUNT(*) as count
        FROM registrations
        WHERE checked_in_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        AND status = 'checked_in'
        GROUP BY DATE(checked_in_at)
        ORDER BY date ASC
    `);

    const checkInsPerDay = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const found = checkInsData.find(r => r.date === dateStr);
        checkInsPerDay.push({
            date: dateStr,
            count: found ? found.count : 0
        });
    }

    return {
        stats,
        registrationsByStatus,
        registrationsBySession,
        checkInsPerDay
    };
}

module.exports = {
    getDashboardData
};
