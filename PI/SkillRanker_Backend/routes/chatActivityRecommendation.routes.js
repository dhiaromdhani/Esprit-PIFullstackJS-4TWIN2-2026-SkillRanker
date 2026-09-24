const express = require('express');
const router = express.Router();

const controller = require('../controllers/chatActivityRecommendation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post(
  '/analyze-existing-activity',
  authenticate,
  authorize('HR_MANAGER', 'ADMINISTRATOR'),
  controller.analyzeExistingActivityFromChat
);

module.exports = router;