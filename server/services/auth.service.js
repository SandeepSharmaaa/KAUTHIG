const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const config = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');

const SALT_ROUNDS = 12;

async function findUserByEmail(email) {
    const [rows] = await pool.query(
        'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
        [email]
    );
    return rows[0] || null;
}

async function hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hash) {
    return bcrypt.compare(plainPassword, hash);
}

function generateToken(userId) {
    return jwt.sign({ sub: userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
}

async function login(email, password) {
    const user = await findUserByEmail(email);
    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user.id);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    };
}

module.exports = {
    findUserByEmail,
    hashPassword,
    verifyPassword,
    generateToken,
    login
};