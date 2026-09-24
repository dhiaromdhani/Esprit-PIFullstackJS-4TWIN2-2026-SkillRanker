const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    console.log('Auth middleware - Authorization header:', header);

    if (!header?.startsWith('Bearer ')) {
      console.log('Auth middleware - No Bearer token found');
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = header.split(' ')[1];
    console.log('Auth middleware - Token received:', token ? 'Present' : 'Missing');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);

    const user = await User.findById(decoded.id).select('-password -googleId');
    console.log(
      'Auth middleware - User found:',
      user
        ? {
            id: user._id,
            role: user.role,
            isActive: user.isActive,
            status: user.status
          }
        : 'Not found'
    );

    if (!user) {
      console.log('Auth middleware - User not found');
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const active =
      typeof user.isActive === 'boolean'
        ? user.isActive
        : String(user.status || '').toUpperCase() === 'ACTIVE';

    if (!active) {
      console.log('Auth middleware - User inactive');
      return res.status(401).json({ message: 'Non autorisé' });
    }

    req.user = user;
    console.log('AUTH user =', req.user);
    console.log('Auth middleware - Authentication successful for user:', user.role);

    next();
  } catch (err) {
    console.log('Auth middleware - Error:', err.message);
    return res.status(401).json({ message: 'Token invalide' });
  }
};

module.exports = { authenticate };