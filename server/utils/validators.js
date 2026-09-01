const { body } = require('express-validator');

const loginValidators = [
    body('email')
        .isEmail().withMessage('A valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
];

module.exports = {
    loginValidators
};