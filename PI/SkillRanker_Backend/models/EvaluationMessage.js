const mongoose = require('mongoose');

const evaluationMessageSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      default: '',
      index: true
    },

    employeeEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
      index: true
    },

    employeeName: {
      type: String,
      default: ''
    },

    managerId: {
      type: String,
      default: ''
    },

    managerName: {
      type: String,
      default: 'Manager'
    },

    activityTitle: {
      type: String,
      default: ''
    },

    note: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    comment: {
      type: String,
      default: ''
    },

    title: {
      type: String,
      default: 'Nouvelle évaluation'
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      default: 'EVALUATION'
    },

    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EvaluationMessage', evaluationMessageSchema);