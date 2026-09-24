const AuditLog = require('../models/AuditLog');

const auditLog = (action, resource) => {
  return async (req, res, next) => {
    if (req.user) {
      await AuditLog.create({
        userId: req.user.id,
        action,
        resource,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    next();
  };
};

module.exports = { auditLog };
