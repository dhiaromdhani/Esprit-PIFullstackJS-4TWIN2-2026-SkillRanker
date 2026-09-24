const express = require('express');
const router = express.Router();

const recommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post(
  '/:activityId',
  authenticate,
  authorize('HR_MANAGER', 'ADMINISTRATOR'),
  recommendationController.recommendEmployees
);

module.exports = router;