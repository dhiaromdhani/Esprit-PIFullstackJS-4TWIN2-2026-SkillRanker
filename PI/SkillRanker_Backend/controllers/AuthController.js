// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const Session = require('../models/Session');

// class AuthController {

//   // ✅ REGISTER
//   static async register(req, res) {
//     try {
//       const { email, password, firstName, lastName,departement, role } = req.body;

//       const existing = await User.findOne({ email });
//       if (existing) {
//         return res.status(400).json({ message: 'Email déjà utilisé' });
//       }

//       const user = await User.create({
//         email,
//         password,
//         firstName,
//         lastName,
//         role
//       });

//       res.status(201).json({
//         message: 'Utilisateur créé',
//         user: {
//           id: user._id,
//           email: user.email,
//           role: user.role
//         }
//       });
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }

//   // ✅ LOGIN
//   static async login(req, res) {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Identifiants invalides' });
//     }

//     const ok = await user.comparePassword(password);
//     if (!ok) {
//       return res.status(401).json({ message: 'Identifiants invalides' });
//     }

//     const accessToken = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET || 'secret-key',
//       { expiresIn: '15m' }
//     );

//     const refreshToken = jwt.sign(
//       { id: user._id },
//       process.env.JWT_REFRESH_SECRET || 'refresh-secret',
//       { expiresIn: '7d' }
//     );

//     await Session.create({
//       userId: user._id,
//       refreshToken,
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//     });

//     res.json({ accessToken, refreshToken });
//   }

//   // ✅ REFRESH TOKEN
//   static async refresh(req, res) {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       return res.status(401).json({ message: 'Refresh token manquant' });
//     }

//     const decoded = jwt.verify(
//       refreshToken,
//       process.env.JWT_REFRESH_SECRET || 'refresh-secret'
//     );

//     const session = await Session.findOne({
//       userId: decoded.id,
//       refreshToken,
//       isValid: true
//     });

//     if (!session) {
//       return res.status(401).json({ message: 'Session invalide' });
//     }

//     const accessToken = jwt.sign(
//       { id: decoded.id },
//       process.env.JWT_SECRET || 'secret-key',
//       { expiresIn: '15m' }
//     );

//     res.json({ accessToken });
//   }

//   // ✅ LOGOUT
//   static async logout(req, res) {
//     const { refreshToken } = req.body;
//     await Session.updateOne({ refreshToken }, { isValid: false });
//     res.json({ message: 'Logout OK' });
//   }
// }

// module.exports = AuthController;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

class AuthController {

  // REGISTER (optional)
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role
      });

      res.status(201).json({ message: 'Utilisateur créé' });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // LOGIN
  static async login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid' });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      'secret-key',
      { expiresIn: '1d' }
    );

    res.json({ accessToken });
  }
}

module.exports = AuthController;
