// const Fiche = require('../models/Fiche');

// // CREATE fiche
// exports.createFiche = async (req, res) => {
//   try {
//     const fiche = await Fiche.create(req.body);
//     res.status(201).json(fiche);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // GET all fiches
// exports.getFiches = async (req, res) => {
//   try {
//     const fiches = await Fiche.find()
//       .populate('user', 'firstName lastName email matricule');
//     res.json(fiches);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // GET fiche by ID
// exports.getFicheById = async (req, res) => {
//   try {
//     const fiche = await Fiche.findById(req.params.id)
//       .populate('user', 'firstName lastName email matricule');
//     if (!fiche) return res.status(404).json({ message: 'Fiche not found' });
//     res.json(fiche);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // UPDATE fiche
// exports.updateFiche = async (req, res) => {
//   try {
//     const fiche = await Fiche.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!fiche) return res.status(404).json({ message: 'Fiche not found' });
//     res.json(fiche);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // DELETE fiche
// exports.deleteFiche = async (req, res) => {
//   try {
//     const fiche = await Fiche.findByIdAndDelete(req.params.id);
//     if (!fiche) return res.status(404).json({ message: 'Fiche not found' });
//     res.json({ message: 'Fiche deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

const Fiche = require('../models/Fiche');

// CREATE
exports.createFiche = async (req, res) => {
  try {

    const fiche = await Fiche.create({
      user: req.user._id,   // ✅ IMPORTANT FIX
      saisons: req.body.saisons,
      etat: req.body.etat
    });

    res.status(201).json(fiche);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
exports.getFiches = async (req, res) => {
  try {
    const fiches = await Fiche.find()
      .populate('user', 'firstName lastName email matricule');

    res.json(fiches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID
exports.getFicheById = async (req, res) => {
  try {
    const fiche = await Fiche.findById(req.params.id)
      .populate('user', 'firstName lastName email matricule');

    if (!fiche) return res.status(404).json({ message: 'Not found' });

    res.json(fiche);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateFiche = async (req, res) => {
  try {
    const fiche = await Fiche.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!fiche) return res.status(404).json({ message: 'Not found' });

    res.json(fiche);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE
exports.deleteFiche = async (req, res) => {
  try {
    const fiche = await Fiche.findByIdAndDelete(req.params.id);

    if (!fiche) return res.status(404).json({ message: 'Not found' });

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};