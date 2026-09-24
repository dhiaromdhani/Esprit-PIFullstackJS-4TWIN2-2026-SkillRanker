const express = require('express');
const router = express.Router();
const activityRequestController = require('../controllers/activityRequest.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.post('/', authenticate, authorize('MANAGER'), activityRequestController.createActivityRequest);
router.get('/', authenticate, authorize('HR_MANAGER', 'MANAGER'), activityRequestController.getActivityRequests);
router.put('/:id', authenticate, authorize('HR_MANAGER'), activityRequestController.updateActivityRequest);
router.delete('/:id', authenticate, authorize('HR_MANAGER'), activityRequestController.deleteActivityRequest);

module.exports = router;