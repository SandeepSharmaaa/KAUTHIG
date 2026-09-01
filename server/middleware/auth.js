const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const config = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');

async function authenticate(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            throw new UnauthorizedError('Not logged in');
        }

        const payload = jwt.verify(token, config.jwt.secret);

        const [rows] = await pool.query(
            'SELECT id, email, name, role FROM users WHERE id = ?',
            [payload.sub]
        );

        const user = rows[0];

        if (!user) {
            throw new UnauthorizedError('User no longer exists');
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Invalid or expired session'));
        }
        next(err);
    }
}

module.exports = authenticate;