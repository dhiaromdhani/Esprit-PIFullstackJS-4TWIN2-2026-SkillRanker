// const User = require('../models/User');

// // CREATE user
// exports.createUser = async (req, res) => {
//   try {
//     const user = await User.create(req.body);
//     res.status(201).json(user);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

/*const User = require('../models/User');
const axios = require('axios');

exports.createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role } = req.body;

    // 🔐 password auto
    const password = Math.random().toString(36).slice(-8) + "A1!";

    const user = new User({
      ...req.body,
      password
    });

    await user.save();

    // 🔥 SEND EMAIL
    await axios.post("http://localhost:5555/api/sendEmail", {
      toEmail: email,
      subject: "Compte créé",
      body: `
Bonjour ${firstName},

Votre compte est prêt.

Email: ${email}
Mot de passe: ${password}
      `
    });

    res.status(201).json({
      message: "User créé + email envoyé",
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET managers
exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'MANAGER' }).select('-password');
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Utilisateur mis à jour', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE (deactivate) user
exports.deleteUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'Utilisateur désactivé' });
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user.id);
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Mot de passe changé' });
};
*/
const User = require('../models/User');
const sendEmail = require('../services/emailService');

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const { email, firstName } = req.body;

    // ✅ check email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // 🔐 generate password
    const password = Math.random().toString(36).slice(-8) + "A1!";

    const user = new User({
      ...req.body,
      password
    });

    await user.save();

    // 📧 send email
    await sendEmail(
      email,
      "Compte créé",
      `Bonjour ${firstName},

Votre compte est prêt.

Email: ${email}
Mot de passe: ${password}`
    );

    res.status(201).json({
      message: "User créé + email envoyé ✅",
      user
    });

  } catch (err) {
    console.error("❌ ERROR:", err);

    res.status(500).json({
      message: err.message,
      error: err
    });
  }
};

// GET USERS
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET MANAGERS
exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'MANAGER' }).select('-password');
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Utilisateur mis à jour', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Utilisateur désactivé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: 'Mot de passe changé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};