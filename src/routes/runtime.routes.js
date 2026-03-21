const express = require('express');
const router = express.Router();
const runtimeController = require('../controllers/runtime.controller');

// Assignment endpoint — no JWT required
// This would be called by your application's backend, not by users directly.
// In production, you'd protect this with an API key instead.
router.post('/experiments/:id/assign', runtimeController.assign);

// Event logging — no JWT required (same reasoning as above)
router.post('/events', runtimeController.logEvents);

module.exports = router;
