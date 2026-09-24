// const express = require('express');
// const router = express.Router();

// const dashboardController = require('../controllers/dashboard.controller');
// const { authenticate } = require('../middlewares/auth.middleware');
// const authorize = require('../middlewares/authorize');

// router.get(
//   '/stats',
//   authenticate,
//   authorize('HR_MANAGER', 'MANAGER', 'ADMINISTRATOR'),
//   dashboardController.getGlobalStats
// );

// router.get(
//   '/responses',
//   authenticate,
//   authorize('HR_MANAGER', 'MANAGER', 'ADMINISTRATOR'),
//   dashboardController.getEmployeeResponses
// );

// module.exports = router;
const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

router.get(
  '/stats',
  authenticate,
  authorize('HR_MANAGER', 'MANAGER', 'ADMINISTRATOR'),
  dashboardController.getGlobalStats
);

router.get(
  '/responses',
  authenticate,
  authorize('HR_MANAGER', 'MANAGER', 'ADMINISTRATOR'),
  dashboardController.getEmployeeResponses
);

router.get(
  '/manager-evaluations',
  authenticate,
  authorize('MANAGER', 'HR_MANAGER', 'ADMINISTRATOR'),
  dashboardController.getManagerEvaluationTargets
);

router.post(
  '/manager-evaluations',
  authenticate,
  authorize('MANAGER', 'HR_MANAGER', 'ADMINISTRATOR'),
  dashboardController.evaluateEmployee
);

router.get(
  '/employee-evaluations',
  authenticate,
  authorize('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMINISTRATOR'),
  dashboardController.getEmployeeReceivedEvaluations
);

module.exports = router;