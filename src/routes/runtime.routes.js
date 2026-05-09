const express = require('express');
const router = express.Router();
const runtimeController = require('../controllers/runtime.controller');
const { requireRuntimeApiKey } = require('../middlewares/apiKey.middleware');

router.post('/experiments/:id/assign', requireRuntimeApiKey, runtimeController.assign);
router.post('/events', requireRuntimeApiKey, runtimeController.logEvents);

module.exports = router;
