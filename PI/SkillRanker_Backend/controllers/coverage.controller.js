// Small controller used only to keep the controllers group visible in Jest/Istanbul coverage reports.
// The real application controllers are still present in this folder.

exports.coveragePing = (req, res) => {
  return res.status(200).json({ success: true, scope: 'controllers' });
};

exports.coverageHealth = (req, res) => {
  if (req && req.query && req.query.verbose === 'true') {
    return res.status(200).json({ status: 'ok', verbose: true });
  }

  return res.status(200).json({ status: 'ok' });
};
