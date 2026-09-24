const Competence = require('../models/Competence');

// CREATE competence
exports.createCompetence = async (req, res) => {
  try {
    const competence = await Competence.create(req.body);
    res.status(201).json(competence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all competences
exports.getCompetences = async (req, res) => {
  try {
    const competences = await Competence.find()
      .populate('fiche')
      .populate('questionCompetence');
    res.json(competences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET competence by ID
exports.getCompetenceById = async (req, res) => {
  try {
    const competence = await Competence.findById(req.params.id)
      .populate('fiche')
      .populate('questionCompetence');
    if (!competence) return res.status(404).json({ message: 'Competence not found' });
    res.json(competence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE competence
exports.updateCompetence = async (req, res) => {
  try {
    const competence = await Competence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!competence) return res.status(404).json({ message: 'Competence not found' });
    res.json(competence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE competence
exports.deleteCompetence = async (req, res) => {
  try {
    const competence = await Competence.findByIdAndDelete(req.params.id);
    if (!competence) return res.status(404).json({ message: 'Competence not found' });
    res.json({ message: 'Competence deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};