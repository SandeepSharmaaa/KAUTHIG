// ============================================================
// registration.routes.js — Registration endpoints
// Two routers: session-scoped and global
// ============================================================

const express = require('express');
const { body } = require('express-validator');
const registrationController = require('../controllers/registration.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const checkSessionAccess = require('../middleware/sessionAccess');
const validate = require('../middleware/validate');

// ── Validators ─────────────────────────────────────────────
const createValidators = [
    body('attendeeName').trim().notEmpty().withMessage('Attendee name is required'),
    body('attendeeEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
];

const noteValidators = [
    body('note').trim().notEmpty().withMessage('Note text is required')
];

const importValidators = [
    body('csvData').notEmpty().withMessage('CSV data is required')
];

// ── Session-scoped router (/api/sessions/:sessionId/registrations) ──
const sessionRegistrationRouter = express.Router({ mergeParams: true });

sessionRegistrationRouter.post('/',
    authenticate, checkSessionAccess, createValidators, validate,
    registrationController.create
);
sessionRegistrationRouter.post('/import',
    authenticate, authorize('organizer'), importValidators, validate,
    registrationController.importCsv
);
sessionRegistrationRouter.get('/export',
    authenticate, checkSessionAccess,
    registrationController.exportCsv
);

// ── Global router (/api/registrations) ─────────────────────
const registrationRouter = express.Router();

registrationRouter.get('/',
    authenticate,
    registrationController.list
);
registrationRouter.get('/:id',
    authenticate, checkSessionAccess,
    registrationController.getOne
);
registrationRouter.patch('/:id/confirm',
    authenticate, checkSessionAccess,
    registrationController.confirm
);
registrationRouter.patch('/:id/cancel',
    authenticate, checkSessionAccess,
    registrationController.cancel
);
registrationRouter.patch('/:id/check-in',
    authenticate, checkSessionAccess,
    registrationController.checkIn
);
registrationRouter.post('/:id/notes',
    authenticate, checkSessionAccess, noteValidators, validate,
    registrationController.addNote
);

module.exports = { sessionRegistrationRouter, registrationRouter };
