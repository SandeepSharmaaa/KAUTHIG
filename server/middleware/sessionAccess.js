const pool = require('../config/db');
const { ForbiddenError } = require('../utils/errors');

module.exports = async function sessionAccess(req, res, next) {
    try {
        if (!req.user) {
            throw new ForbiddenError('Not authenticated');
        }

        // Organizers always have access
        if (req.user.role === 'organizer') {
            return next();
        }

        // Guests can view sessions and create registrations
        if (req.user.role === 'guest') {
            return next();
        }

        if (req.user.role !== 'check_in_staff') {
            throw new ForbiddenError('Access denied');
        }

        let sessionId = req.params.sessionId;

        // If no sessionId in params, but we have an id (e.g. registration id)
        if (!sessionId && req.params.id) {
            const [rows] = await pool.query(
                'SELECT session_id FROM registrations WHERE id = ?',
                [req.params.id]
            );
            if (rows.length > 0) {
                sessionId = rows[0].session_id;
            }
        }

        if (!sessionId) {
            throw new ForbiddenError('Could not determine session for access check');
        }

        // Check if assigned to this session
        const [assignments] = await pool.query(
            'SELECT 1 FROM staff_assignments WHERE session_id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (assignments.length === 0) {
            throw new ForbiddenError('Not assigned to this session');
        }

        next();
    } catch (error) {
        next(error);
    }
};
