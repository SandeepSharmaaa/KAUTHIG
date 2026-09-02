// ============================================================
// user.routes.js — User management routes (organizer only)
// ============================================================

const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/users — list all users (filter by ?role=check_in_staff)
router.get('/', authenticate, authorize('organizer'), userController.list);

// GET /api/users/:id — get user by ID
router.get('/:id', authenticate, authorize('organizer'), userController.getOne);

// POST /api/users — create a new user (organizer only)
router.post('/',
    authenticate,
    authorize('organizer'),
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['organizer', 'check_in_staff']).withMessage('Role must be organizer or check_in_staff')
    ],
    validate,
    userController.create
);

module.exports = router;
