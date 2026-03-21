const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metrics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All metrics routes require authentication (viewers and admins can see metrics)
router.use(authenticate);

// GET /experiments/:id/metrics
router.get('/:id/metrics', metricsController.getMetrics);

module.exports = router;
