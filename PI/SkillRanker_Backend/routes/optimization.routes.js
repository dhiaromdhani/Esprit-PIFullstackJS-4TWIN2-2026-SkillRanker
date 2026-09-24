const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/optimization.controller');

router.post('/activity/:activityId', ctrl.optimizeSelection);
router.post('/simulate/:activityId', ctrl.simulateWeights);
router.get('/gaps/:activityId', ctrl.analyzeGaps);

module.exports = router;