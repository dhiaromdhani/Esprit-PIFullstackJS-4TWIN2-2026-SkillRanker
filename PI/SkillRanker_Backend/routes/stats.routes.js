const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.get('/skills', authenticate, authorize('HR_MANAGER', 'MANAGER'), statsController.getSkillStats);
router.get('/activities', authenticate, authorize('HR_MANAGER', 'MANAGER'), statsController.getActivityStats);

module.exports = router;