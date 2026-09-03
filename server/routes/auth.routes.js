const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const { loginValidators } = require('../utils/validators');
const validate = require('../middleware/validate');

const { body } = require('express-validator');

const router = express.Router();

// Rate limit login/signup attempts: 10 per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: { message: 'Too many attempts, please try again later' } }
});

const signupValidators = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['organizer', 'check_in_staff', 'guest']).withMessage('Invalid role')
];

router.post('/login', authLimiter, loginValidators, validate, authController.login);
router.post('/signup', authLimiter, signupValidators, validate, authController.signup);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;