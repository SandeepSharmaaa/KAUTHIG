const express = require('express');
const eventController = require('../controllers/event.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/', authenticate, eventController.list);
router.post('/', authenticate, authorize('organizer'), eventController.create);
router.get('/:id', authenticate, eventController.getOne);
router.put('/:id', authenticate, authorize('organizer'), eventController.update);
router.patch('/:id/archive', authenticate, authorize('organizer'), eventController.archive);

module.exports = router;