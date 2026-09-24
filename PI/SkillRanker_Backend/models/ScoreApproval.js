const mongoose = require('mongoose');

const ScoreApprovalSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ScoreApproval', ScoreApprovalSchema);