const express = require('express');
const { list, count, dismiss } = require('../controllers/alert.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, list);
router.get('/count', authenticate, count);
router.patch('/:sessionId/dismiss', authenticate, authorize('organizer'), dismiss);

module.exports = router;
