const { ForbiddenError } = require('../utils/errors');

function authorize(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user) {
            throw new Error('authorize() used without authenticate() running first');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError('You do not have permission to perform this action');
        }

        next();
    };
}

module.exports = authorize;