// const mongoose = require('mongoose');

// const requiredSkillSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     type: {
//       type: String,
//       enum: ['KNOWLEDGE', 'KNOW_HOW', 'SOFT_SKILL'],
//       default: 'KNOWLEDGE'
//     },
//     desiredLevel: {
//       type: String,
//       enum: ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'],
//       default: 'MEDIUM'
//     },
//     weight: { type: Number, default: 1, min: 1, max: 10 }
//   },
//   { _id: false }
// );

// const recommendedEmployeeSchema = new mongoose.Schema(
//   {
//     csvEmployeeId: { type: Number, default: null },
//     employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     name: { type: String, trim: true, default: '' },
//     email: { type: String, trim: true, lowercase: true, default: '' },
//     jobTitle: { type: String, trim: true, default: '' },
//     currentSkills: { type: String, default: '' },
//     score: { type: Number, default: 0 },
//     reason: { type: String, default: '' },
//     matchedInMongo: { type: Boolean, default: false },
//     autoProvisioned: { type: Boolean, default: false }
//   },
//   { _id: false }
// );

// const selectedEmployeeSchema = new mongoose.Schema(
//   {
//     csvEmployeeId: { type: Number, default: null },
//     employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     name: { type: String, trim: true, default: '' },
//     email: { type: String, trim: true, lowercase: true, default: '' },
//     score: { type: Number, default: 0 },

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

//     justification: { type: String, default: '' },
//     selectedAt: { type: Date, default: Date.now },
//     respondedAt: { type: Date, default: null }
//   },
//   { _id: false }
// );

// const activitySchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     description: { type: String, default: '' },

//     type: {
//       type: String,
//       enum: ['TRAINING', 'CERTIFICATION', 'PROJECT', 'MISSION', 'AUDIT'],
//       default: 'TRAINING'
//     },

//     category: {
//       type: String,
//       enum: ['TECHNICAL', 'MANAGEMENT', 'TRANSVERSAL'],
//       default: 'TECHNICAL'
//     },

//     requiredSkills: { type: [requiredSkillSchema], default: [] },
//     seats: { type: Number, default: 5, min: 1 },

//     latestRecommendationPrompt: { type: String, default: '' },

//     status: {
//       type: String,
//       enum: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
//       default: 'OPEN'
//     },

//     recommendedEmployees: { type: [recommendedEmployeeSchema], default: [] },
//     selectedEmployees: { type: [selectedEmployeeSchema], default: [] },

//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Activity', activitySchema);
const mongoose = require('mongoose');

const requiredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['KNOWLEDGE', 'KNOW_HOW', 'SOFT_SKILL'],
      default: 'KNOWLEDGE'
    },
    desiredLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EXPERT'],
      default: 'MEDIUM'
    },
    weight: { type: Number, default: 1, min: 1, max: 10 }
  },
  { _id: false }
);

const recommendedEmployeeSchema = new mongoose.Schema(
  {
    csvEmployeeId: { type: Number, default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    currentSkills: { type: String, default: '' },
    score: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    matchedInMongo: { type: Boolean, default: false },
    autoProvisioned: { type: Boolean, default: false }
  },
  { _id: false }
);

const selectedEmployeeSchema = new mongoose.Schema(
  {
    csvEmployeeId: { type: Number, default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    score: { type: Number, default: 0 },

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

    justification: { type: String, default: '' },
    selectedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },

    managerScore: { type: Number, default: null, min: 1, max: 5 },
    managerComment: { type: String, default: '' },
    managerEvaluatedAt: { type: Date, default: null },
    managerEvaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    type: {
      type: String,
      enum: ['TRAINING', 'CERTIFICATION', 'PROJECT', 'MISSION', 'AUDIT'],
      default: 'TRAINING'
    },

    category: {
      type: String,
      enum: ['TECHNICAL', 'MANAGEMENT', 'TRANSVERSAL'],
      default: 'TECHNICAL'
    },

    requiredSkills: { type: [requiredSkillSchema], default: [] },
    seats: { type: Number, default: 5, min: 1 },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    latestRecommendationPrompt: { type: String, default: '' },

    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN'
    },

    recommendedEmployees: { type: [recommendedEmployeeSchema], default: [] },
    selectedEmployees: { type: [selectedEmployeeSchema], default: [] },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);