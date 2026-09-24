// const express = require('express');
// const router = express.Router();

// const ctrl = require('../controllers/notification.controller');
// const { authenticate } = require('../middlewares/auth.middleware');
// const authorize = require('../middlewares/authorize');

// // HR / Admin
// router.post('/send-activity', authenticate, authorize('HR_MANAGER', 'ADMINISTRATOR'), ctrl.sendActivityNotification);
// router.post('/confirm-recommendations', authenticate, authorize('HR_MANAGER', 'ADMINISTRATOR'), ctrl.confirmRecommendations);

// // Employee
// router.post('/respond', authenticate, authorize('EMPLOYEE'), ctrl.respondToActivity);
// router.post('/complete', authenticate, authorize('EMPLOYEE'), ctrl.completeActivity);
// router.get('/my-activities', authenticate, authorize('EMPLOYEE'), ctrl.getMyActivities);
// router.get('/pending-trainings', authenticate, authorize('EMPLOYEE'), ctrl.getPendingTrainings);

// // Manager
// router.get('/approvals', authenticate, authorize('MANAGER'), ctrl.getManagerApprovals);
// router.put('/approvals/:approvalId', authenticate, authorize('MANAGER'), ctrl.handleApproval);

// // Notifications générales
// router.get('/my-notifications', authenticate, ctrl.getMyNotifications);
// router.put('/read/:id', authenticate, ctrl.markAsRead);
// router.put('/read-all', authenticate, ctrl.markAllAsRead);

// module.exports = router;
const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.get('/my-notifications', authenticate, notificationController.getMyNotifications);
router.get('/my-activities', authenticate, notificationController.getMyActivities);
router.put('/read/:id', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);

router.post(
  '/send-activity',
  authenticate,
  authorize('HR_MANAGER', 'ADMINISTRATOR'),
  notificationController.sendActivityNotification
);

router.post(
  '/confirm-recommendations',
  authenticate,
  authorize('HR_MANAGER', 'ADMINISTRATOR'),
  notificationController.confirmRecommendations
);

router.post('/respond', authenticate, notificationController.respondToActivity);
router.post('/complete', authenticate, notificationController.completeActivity);

router.get(
  '/certification-approvals',
  authenticate,
  authorize('HR_MANAGER', 'ADMINISTRATOR'),
  notificationController.getCertificationApprovals
);

router.post(
  '/approve-certification',
  authenticate,
  authorize('HR_MANAGER', 'ADMINISTRATOR'),
  notificationController.approveCertification
);

router.get('/approvals', authenticate, notificationController.getManagerApprovals);
router.put('/approvals/:approvalId', authenticate, notificationController.handleApproval);

module.exports = router;
