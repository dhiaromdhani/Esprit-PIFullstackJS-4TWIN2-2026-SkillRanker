const mongoose = require('mongoose');

const ficheSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // user_id
  saisons: { type: String, required: true }, // Evaluation period (e.g., "2025", "2026")
  etat: { type: String, enum: ['draft', 'in_progress', 'completed', 'validated'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Fiche', ficheSchema);