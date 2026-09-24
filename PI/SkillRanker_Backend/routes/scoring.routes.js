const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scoring.controller');

router.get('/employee/:employeeId', ctrl.calculateEmployeeScore);
router.get('/employee/:employeeId/activity/:activityId', ctrl.scoreEmployeeForActivity);
router.post('/employee/:employeeId/post-activity', ctrl.updateScoreAfterParticipation);
router.post('/recalculate-all', ctrl.recalculateAllScores);
router.get('/leaderboard', ctrl.getLeaderboard);

module.exports = router;