const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  ipAddress: String,
  userAgent: String,
  lastActivity: Date,
  expiresAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
