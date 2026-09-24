const QuestionCompetence = require('../models/QuestionCompetence');

// CREATE question competence
exports.createQuestionCompetence = async (req, res) => {
  try {
    const questionCompetence = await QuestionCompetence.create(req.body);
    res.status(201).json(questionCompetence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all question competences
exports.getQuestionCompetences = async (req, res) => {
  try {
    const questionCompetences = await QuestionCompetence.find();
    res.json(questionCompetences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET question competence by ID
exports.getQuestionCompetenceById = async (req, res) => {
  try {
    const questionCompetence = await QuestionCompetence.findById(req.params.id);
    if (!questionCompetence) return res.status(404).json({ message: 'Question Competence not found' });
    res.json(questionCompetence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE question competence
exports.updateQuestionCompetence = async (req, res) => {
  try {
    const questionCompetence = await QuestionCompetence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!questionCompetence) return res.status(404).json({ message: 'Question Competence not found' });
    res.json(questionCompetence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE question competence
exports.deleteQuestionCompetence = async (req, res) => {
  try {
    const questionCompetence = await QuestionCompetence.findByIdAndDelete(req.params.id);
    if (!questionCompetence) return res.status(404).json({ message: 'Question Competence not found' });
    res.json({ message: 'Question Competence deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};