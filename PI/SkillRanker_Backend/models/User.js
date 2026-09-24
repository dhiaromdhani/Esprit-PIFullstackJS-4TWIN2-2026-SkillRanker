// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserRole = {
//   // SUPER_ADMIN: 'SUPER_ADMIN',
//   ADMINISTRATOR: 'ADMINISTRATOR',
//   // PHYSICIAN: 'PHYSICIAN',
//   // NURSE: 'NURSE',
//   // COORDINATOR: 'COORDINATOR',
//   EMPLOYEE: 'EMPLOYEE',
//   MANAGER: 'MANAGER',
//   HR_MANAGER: 'HR_MANAGER'
// };

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, minlength: 8 }, // optional for OAuth
//   googleId: { type: String },              // for Google OAuth
//   oauth: {
//     githubId: { type: String },
//     linkedinId: { type: String }
//   },
//   firstName: String,
//   lastName: String,
//   name: String, // Full name
//   matricule: { type: String, unique: true },
//   telephone: String,
//   dateEmbauche: Date,
//   department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
//   manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // manager_id
//   status: { type: String, default: 'ACTIVE' },
//   enLigne: { type: Boolean, default: false }, // en_ligne
//   role: { type: String, enum: Object.values(UserRole), default: 'EMPLOYEE' },
//   isActive: { type: Boolean, default: true },
//   departement: String, // Keep for backward compatibility
//   assignedActivities: [{
//     activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
//     assignedAt: { type: Date, default: Date.now },
//     status: {
//       type: String,
//       enum: ['ASSIGNED', 'ACCEPTED', 'REFUSED', 'IN_PROGRESS', 'COMPLETED', 'CERTIFIED'],
//       default: 'ASSIGNED'
//     },
//     completedAt: Date,
//     respondedAt: Date,
//     certificateUrl: String,
//     employeeResponse: String  }]
// }, { timestamps: true });

// userSchema.pre('save', async function () {
//   if (!this.isModified('password') || !this.password) return;
//   this.password = await bcrypt.hash(this.password, 12);
// });

// userSchema.methods.comparePassword = function (password) {
//   if (!this.password) return false; // if OAuth user, no password
//   return bcrypt.compare(password, this.password);
// };

// module.exports = mongoose.model('User', userSchema);
// module.exports.UserRole = UserRole;

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserRole = {
//   ADMINISTRATOR: 'ADMINISTRATOR',
//   EMPLOYEE: 'EMPLOYEE',
//   MANAGER: 'MANAGER',
//   HR_MANAGER: 'HR_MANAGER'
// };

// const assignedActivitySchema = new mongoose.Schema(
//   {
//     activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
//     title: { type: String, default: '' },
//     description: { type: String, default: '' },
//     type: { type: String, default: '' },
//     category: { type: String, default: '' },

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
//       default: 'PENDING'
//     },

//     justification: { type: String, default: '' },
//     notificationRead: { type: Boolean, default: false },
//     emailSent: { type: Boolean, default: false },

//     completedAt: { type: Date, default: null },
//     respondedAt: { type: Date, default: null },
//     certificateUrl: { type: String, default: '' },
//     employeeResponse: { type: String, default: '' }
//   },
//   { _id: true }
// );

// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true
//     },
//     password: { type: String, minlength: 8 },
//     googleId: { type: String },
//     oauth: {
//       githubId: { type: String },
//       linkedinId: { type: String }
//     },
//     firstName: { type: String, default: '' },
//     lastName: { type: String, default: '' },
//     name: { type: String, default: '' },
//     matricule: { type: String, unique: true, sparse: true },
//     telephone: { type: String, default: '' },
//     dateEmbauche: Date,
//     department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
//     manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     status: {
//       type: String,
//       enum: ['ACTIVE', 'INACTIVE'],
//       default: 'ACTIVE'
//     },
//     enLigne: { type: Boolean, default: false },
//     role: {
//       type: String,
//       enum: Object.values(UserRole),
//       default: 'EMPLOYEE'
//     },
//     isActive: { type: Boolean, default: true },
//     departement: { type: String, default: '' },
//     assignedActivities: {
//       type: [assignedActivitySchema],
//       default: []
//     }
//   },
//   { timestamps: true }
// );

// userSchema.pre('save', async function () {
//   if (!this.isModified('password') || !this.password) return;

//   const alreadyHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
//   if (alreadyHashed) return;

//   this.password = await bcrypt.hash(this.password, 12);
// });

// userSchema.methods.comparePassword = async function (password) {
//   if (!this.password) return false;
//   return bcrypt.compare(password, this.password);
// };

// module.exports = mongoose.model('User', userSchema);
// module.exports.UserRole = UserRole;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserRole = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  HR_MANAGER: 'HR_MANAGER'
};

const assignedActivitySchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, default: '' },
    category: { type: String, default: '' },

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
      default: 'PENDING'
    },

    justification: { type: String, default: '' },
    notificationRead: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },

    completedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
    certificateUrl: { type: String, default: '' },
    employeeResponse: { type: String, default: '' }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: { type: String, minlength: 8 },
    googleId: { type: String },
    oauth: {
      githubId: { type: String },
      linkedinId: { type: String }
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    name: { type: String, default: '' },
    matricule: { type: String, unique: true, sparse: true },
    telephone: { type: String, default: '' },
    dateEmbauche: Date,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    enLigne: { type: Boolean, default: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: 'EMPLOYEE'
    },
    isActive: { type: Boolean, default: true },
    departement: { type: String, default: '' },
    assignedActivities: {
      managerScore: { type: Number, default: null, min: 1, max: 5 },
      managerComment: { type: String, default: '' },
      managerEvaluatedAt: { type: Date, default: null },
      managerEvaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      type: [assignedActivitySchema],
      default: []
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  const alreadyHashed = /^\$2[aby]\$\d{2}\$/.test(this.password);
  if (alreadyHashed) return;

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.UserRole = UserRole;

