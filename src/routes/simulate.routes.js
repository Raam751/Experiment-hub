const express = require('express');
const router = express.Router();
const simulateController = require('../controllers/simulate.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(authenticate);
router.use(authorize('admin'));

router.post('/:id/simulate', simulateController.simulate);

module.exports = router;
