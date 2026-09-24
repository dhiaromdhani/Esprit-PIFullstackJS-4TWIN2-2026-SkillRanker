const ActivityRequest = require('../models/ActivityRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// CREATE activity request
exports.createActivityRequest = async (req, res) => {
  try {
    const request = await ActivityRequest.create(req.body);
    // Notify HR/Managers
    const managers = await User.find({ role: { $in: ['HR_MANAGER', 'MANAGER'] } });
    for (const manager of managers) {
      await Notification.create({
        recipient: manager._id,
        type: 'request',
        message: `New activity request for ${request.activity.title}`,
        relatedId: request._id
      });
    }
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET all activity requests
exports.getActivityRequests = async (req, res) => {
  try {
    const requests = await ActivityRequest.find().populate('activity manager requestedEmployees');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE activity request (approve/reject)
exports.updateActivityRequest = async (req, res) => {
  try {
    const request = await ActivityRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Notify requester
    await Notification.create({
      recipient: request.manager,
      type: request.status === 'approved' ? 'approval' : 'rejection',
      message: `Your activity request has been ${request.status}`,
      relatedId: request._id
    });

    // If approved, notify selected employees
    if (request.status === 'approved' && request.requestedEmployees.length > 0) {
      for (const empId of request.requestedEmployees) {
        // Assuming employees have user accounts or we need to link
        // For now, skip or create notification for HR
      }
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE activity request
exports.deleteActivityRequest = async (req, res) => {
  try {
    const request = await ActivityRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};