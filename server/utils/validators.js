const { body } = require('express-validator');

const loginValidators = [
    body('email')
        .isEmail().withMessage('A valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
];

const eventValidators = [
    body('name')
        .trim().notEmpty().withMessage('Event name is required')
        .isLength({ max: 255 }).withMessage('Name must be under 255 characters'),
    body('startDate')
        .isISO8601().withMessage('Valid start date is required (YYYY-MM-DD)'),
    body('endDate')
        .isISO8601().withMessage('Valid end date is required (YYYY-MM-DD)')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.startDate)) {
                throw new Error('End date must be on or after start date');
            }
            return true;
        }),
    body('venue')
        .trim().notEmpty().withMessage('Venue is required')
        .isLength({ max: 255 }).withMessage('Venue must be under 255 characters'),
    body('description')
        .optional({ values: 'falsy' }).trim()
];

module.exports = {
    loginValidators,
    eventValidators
};