const express = require('express');
const router = express.Router();

const controller = require('../controllers/activity.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

// CRUD
router.post('/', authenticate, authorize('HR_MANAGER'), controller.createActivity);
router.get('/', authenticate, controller.getActivities);

// IMPORTANT : avant /:id
router.get('/my/activities', authenticate, controller.getMyActivities);

router.get('/:id', authenticate, controller.getActivityById);
router.put('/:id', authenticate, controller.updateActivity);
router.delete('/:id', authenticate, authorize('HR_MANAGER'), controller.deleteActivity);

// Ancien workflow interne
router.post('/:activityId/recommend', authenticate, authorize('HR_MANAGER'), controller.recommendEmployees);
router.put('/:activityId/recommendations', authenticate, authorize('HR_MANAGER'), controller.updateRecommendations);
router.post('/:activityId/forward', authenticate, authorize('HR_MANAGER'), controller.forwardToManager);
router.post('/:activityId/confirm', authenticate, authorize('MANAGER'), controller.confirmParticipants);
router.post('/:activityId/respond', authenticate, authorize('EMPLOYEE'), controller.respondToInvitation);

module.exports = router;