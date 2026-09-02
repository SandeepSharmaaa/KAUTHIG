const express = require('express');
const { body } = require('express-validator');
const staffController = require('../controllers/staff.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const staffRouter = express.Router({ mergeParams: true });
const myAssignmentsRouter = express.Router();

staffRouter.get(
    '/',
    auth,
    authorize('organizer'),
    staffController.list
);

staffRouter.post(
    '/',
    auth,
    authorize('organizer'),
    [body('userId').isInt().withMessage('User ID must be an integer')],
    validate,
    staffController.assign
);

staffRouter.delete(
    '/:userId',
    auth,
    authorize('organizer'),
    staffController.remove
);

myAssignmentsRouter.get(
    '/',
    auth,
    staffController.myAssignments
);

module.exports = {
    staffRouter,
    myAssignmentsRouter
};
