// const mongoose = require('mongoose');

// const NotificationSchema = new mongoose.Schema({
//   recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   type: { type: String, enum: ['request', 'approval', 'rejection', 'recommendation'], required: true },
//   message: { type: String, required: true },
//   relatedId: { type: mongoose.Schema.Types.ObjectId }, // e.g., activityRequest or recommendation id
//   isRead: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Notification', NotificationSchema);
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['ACTIVITY_ASSIGNED', 'EMPLOYEE_RESPONSE', 'APPROVAL_NEEDED', 'APPROVAL_RESULT', 'GENERAL'],
    default: 'GENERAL',
  },
  read: {
    type: Boolean,
    default: false,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);