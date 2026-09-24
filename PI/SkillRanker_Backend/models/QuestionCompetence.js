const mongoose = require('mongoose');

const questionCompetenceSchema = new mongoose.Schema({
  intitule: { type: String, required: true }, // Competency category
  details: { type: String }, // Detailed description
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('QuestionCompetence', questionCompetenceSchema);