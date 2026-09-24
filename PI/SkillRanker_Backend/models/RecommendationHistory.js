const mongoose = require('mongoose');

const RecommendationHistorySchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  recommendedEmployees: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    score: Number,
    reason: String
  }],
  selectedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  decisionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decisionDate: { type: Date, default: Date.now },
  notes: String
});

module.exports = mongoose.model('RecommendationHistory', RecommendationHistorySchema);