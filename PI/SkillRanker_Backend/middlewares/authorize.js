function normalizeRole(role) {
  const value = String(role || '').trim().toUpperCase();

  const aliases = {
    'HR MANAGER': 'HR_MANAGER',
    'HR-MANAGER': 'HR_MANAGER',
    'RH_MANAGER': 'HR_MANAGER',
    'RH MANAGER': 'HR_MANAGER',
    'RH': 'HR_MANAGER',
    'ADMIN': 'ADMINISTRATOR'
  };

  return aliases[value] || value;
}

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('AUTHORIZE req.user =', req.user);
    console.log('AUTHORIZE allowedRoles =', allowedRoles);

    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

    console.log('AUTHORIZE userRole =', userRole);
    console.log('AUTHORIZE normalizedAllowedRoles =', normalizedAllowedRoles);

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Accès refusé',
        userRole,
        allowedRoles: normalizedAllowedRoles
      });
    }

    next();
  };
};