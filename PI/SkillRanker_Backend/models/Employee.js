// const mongoose = require('mongoose');

// const skillSchema = new mongoose.Schema(
//   {
//     name: { type: String, trim: true, required: true },
//     level: { type: Number, default: 3 }
//   },
//   { _id: false }
// );

// const assignedActivitySchema = new mongoose.Schema(
//   {
//     activityId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Activity',
//       required: true
//     },
//     title: { type: String, trim: true, default: '' },
//     description: { type: String, trim: true, default: '' },
//     type: { type: String, trim: true, default: '' },
//     category: { type: String, trim: true, default: '' },

//     assignedAt: { type: Date, default: Date.now },

//     status: {
//       type: String,
//       enum: [
//         'PENDING',
//         'ASSIGNED',
//         'ACCEPTED',
//         'DECLINED',
//         'REFUSED',
//         'IN_PROGRESS',
//         'COMPLETED',
//         'CERTIFIED'
//       ],
//       default: 'ASSIGNED'
//     },

//     justification: { type: String, trim: true, default: '' },
//     notificationRead: { type: Boolean, default: false },
//     emailSent: { type: Boolean, default: false },
//     completedAt: { type: Date, default: null },
//     respondedAt: { type: Date, default: null },
//     certificateUrl: { type: String, default: '' },
//     employeeResponse: { type: String, default: '' }
//   },
//   { _id: false }
// );

// const employeeSchema = new mongoose.Schema(
//   {
//     csvEmployeeId: { type: Number, index: true, sparse: true },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

//     firstName: { type: String, required: true, trim: true },
//     lastName: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     jobTitle: { type: String, required: true, trim: true },
//     department: { type: String, default: 'General', trim: true },

//     skills: { type: [skillSchema], default: [] },
//     assignedActivities: { type: [assignedActivitySchema], default: [] }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Employee', employeeSchema);

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    level: { type: Number, default: 3 }
  },
  { _id: false }
);

const assignedActivitySchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true
    },
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },

    assignedAt: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: [
        'PENDING',
        'ASSIGNED',
        'ACCEPTED',
        'DECLINED',
        'REFUSED',
        'IN_PROGRESS',
        'COMPLETED',
        'CERTIFIED'
      ],
      default: 'ASSIGNED'
    },

    justification: { type: String, trim: true, default: '' },
    notificationRead: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
    certificateUrl: { type: String, default: '' },
    employeeResponse: { type: String, default: '' }
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    csvEmployeeId: { type: Number, index: true, sparse: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, default: 'General', trim: true },

    skills: { type: [skillSchema], default: [] },
    assignedActivities: { type: [assignedActivitySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);