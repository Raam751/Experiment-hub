const express = require('express');
const router = express.Router();
const internalController = require('../controllers/internal.controller');
const { requireApiKey } = require('../middlewares/apiKey.middleware');

// All internal routes are protected by API key, NOT JWT
router.use(requireApiKey);

// PATCH /internal/experiments/:id/weights
router.patch('/experiments/:id/weights', internalController.updateWeights);

module.exports = router;
