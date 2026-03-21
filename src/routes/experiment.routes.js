const express = require('express');
const router = express.Router();
const experimentController = require('../controllers/experiment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// All experiment routes require authentication
router.use(authenticate);

// POST   /experiments          — admin only
router.post('/', authorize('admin'), experimentController.create);

// GET    /experiments          — admin & viewer
router.get('/', experimentController.findAll);

// GET    /experiments/:id      — admin & viewer
router.get('/:id', experimentController.findById);

// PATCH  /experiments/:id      — admin only (metadata: name, description)
router.patch('/:id', authorize('admin'), experimentController.updateMetadata);

// PATCH  /experiments/:id/status — admin only (state machine transition)
router.patch('/:id/status', authorize('admin'), experimentController.updateStatus);

// DELETE /experiments/:id      — admin only (draft experiments only)
router.delete('/:id', authorize('admin'), experimentController.remove);

module.exports = router;
