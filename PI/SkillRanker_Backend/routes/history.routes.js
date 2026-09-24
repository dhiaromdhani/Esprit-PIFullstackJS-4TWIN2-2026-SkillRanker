const express = require('express');
const router = express.Router();
const RecommendationHistory = require('../models/RecommendationHistory');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize');

// GET history
router.get('/', authenticate, authorize('HR_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const history = await RecommendationHistory.find().populate('activity recommendedEmployees.employee selectedEmployees decisionBy');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;