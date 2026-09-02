const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const { loginValidators } = require('../utils/validators');
const validate = require('../middleware/validate');

const router = express.Router();

// Rate limit login attempts: 10 per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: { message: 'Too many login attempts, please try again later' } }
});

router.post('/login', authLimiter, loginValidators, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;