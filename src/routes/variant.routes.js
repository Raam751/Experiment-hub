const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// All variant routes require authentication
router.use(authenticate);

// POST   /experiments/:id/variants   — admin only
router.post('/experiments/:id/variants', authorize('admin'), variantController.create);

// GET    /experiments/:id/variants   — admin & viewer
router.get('/experiments/:id/variants', variantController.findByExperimentId);

// PATCH  /variants/:variantId        — admin only
router.patch('/variants/:variantId', authorize('admin'), variantController.update);

// DELETE /variants/:variantId        — admin only (draft only)
router.delete('/variants/:variantId', authorize('admin'), variantController.remove);

module.exports = router;
