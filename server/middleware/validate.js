const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const message = errors.array().map((e) => e.msg).join(', ');
        throw new ValidationError(message);
    }

    next();
}

module.exports = validate;