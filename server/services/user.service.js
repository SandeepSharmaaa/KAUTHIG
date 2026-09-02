// ============================================================
// user.service.js — User management for organizers
// ============================================================

const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { NotFoundError, ValidationError } = require('../utils/errors');

const SALT_ROUNDS = 12;

async function listUsers({ role } = {}) {
    let query = 'SELECT id, name, email, role, created_at FROM users';
    const params = [];

    if (role) {
        query += ' WHERE role = ?';
        params.push(role);
    }

    query += ' ORDER BY name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
}

async function getUserById(id) {
    const [rows] = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
        [id]
    );
    if (rows.length === 0) {
        throw new NotFoundError('User not found');
    }
    return rows[0];
}

async function createUser({ name, email, password, role }) {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        throw new ValidationError('Email already registered');
    }

    // Validate role
    const validRoles = ['organizer', 'check_in_staff'];
    if (!validRoles.includes(role)) {
        throw new ValidationError('Role must be organizer or check_in_staff');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role]
    );

    return getUserById(result.insertId);
}

module.exports = { listUsers, getUserById, createUser };
