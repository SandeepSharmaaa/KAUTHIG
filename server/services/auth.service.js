const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const config = require('../config/env');
const { UnauthorizedError, ValidationError } = require('../utils/errors');

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

async function signup({ name, email, password, role }) {
    const validRoles = ['organizer', 'check_in_staff', 'guest'];
    if (!validRoles.includes(role)) {
        throw new ValidationError('Invalid role');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
        throw new ValidationError('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role]
    );

    const token = generateToken(result.insertId);
    return {
        token,
        user: { id: result.insertId, email, name, role }
    };
}

module.exports = {
    findUserByEmail,
    hashPassword,
    verifyPassword,
    generateToken,
    login,
    signup
};