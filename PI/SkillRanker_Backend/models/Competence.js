const mongoose = require('mongoose');

const competenceSchema = new mongoose.Schema({
  fiche: { type: mongoose.Schema.Types.ObjectId, ref: 'Fiche', required: true }, // fiches_id
  questionCompetence: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionCompetence', required: true }, // question_competence_id
  type: { type: String, required: true },
  intitule: { type: String, required: true },
  autoEval: { type: Number, min: 0, max: 5 }, // auto_eval
  hierarchieEval: { type: Number, min: 0, max: 5 }, // hierarchie_eval
  etat: { type: String, enum: ['draft', 'submitted', 'validated'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Competence', competenceSchema);