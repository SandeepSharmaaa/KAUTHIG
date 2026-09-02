const express = require('express');
const { body } = require('express-validator');
const sessionController = require('../controllers/session.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const eventSessionRouter = express.Router({ mergeParams: true });
const sessionRouter = express.Router();

const sessionValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('startTime').isISO8601().withMessage('Invalid start time'),
    body('durationMinutes').isInt({ min: 1 }).withMessage('Duration must be positive'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be positive')
];

eventSessionRouter.post(
    '/',
    auth,
    authorize('organizer'),
    sessionValidation,
    validate,
    sessionController.create
);

eventSessionRouter.get(
    '/',
    auth,
    sessionController.list
);

sessionRouter.get(
    '/:id',
    auth,
    sessionController.getOne
);

sessionRouter.put(
    '/:id',
    auth,
    authorize('organizer'),
    sessionValidation,
    validate,
    sessionController.update
);

sessionRouter.delete(
    '/:id',
    auth,
    authorize('organizer'),
    sessionController.remove
);

module.exports = {
    eventSessionRouter,
    sessionRouter
};
