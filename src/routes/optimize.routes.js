const express = require('express');
const router = express.Router();
const optimizeController = require('../controllers/optimize.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Routes require authentication and admin role (only admins can trigger traffic shifts)
router.use(authenticate);
router.use(authorize('admin'));

// POST /experiments/:id/optimize
router.post('/:id/optimize', optimizeController.triggerOptimization);

module.exports = router;
