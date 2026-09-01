const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const { loginValidators } = require('../utils/validators');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/login', loginValidators, validate, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;