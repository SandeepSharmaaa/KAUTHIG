// ============================================================
// user.controller.js — User management endpoints
// ============================================================

const userService = require('../services/user.service');

async function list(req, res) {
    const { role } = req.query;
    const users = await userService.listUsers({ role });
    res.json({ users });
}

async function getOne(req, res) {
    const user = await userService.getUserById(req.params.id);
    res.json({ user });
}

async function create(req, res) {
    const { name, email, password, role } = req.body;
    const user = await userService.createUser({ name, email, password, role });
    res.status(201).json({ user });
}

module.exports = { list, getOne, create };
