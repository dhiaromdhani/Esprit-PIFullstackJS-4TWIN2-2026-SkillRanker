const Activity = require('../models/Activity');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

// AI-based employee recommendation
exports.recommendEmployees = async (req, res) => {
  try {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId).populate('department');

    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // Simple AI recommendation logic (can be enhanced with ML)
    const employees = await Employee.find();
    const recommended = employees
      .filter(emp => emp.skills && emp.skills.length > 0)
      .map(emp => ({
        employee: emp._id,
        score: Math.random() * 5 + 1, // Mock AI score
        reason: `Based on ${emp.skills.length} matching skills`
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 recommendations

    activity.recommendedEmployees = recommended;
    activity.status = 'ai_recommended';
    await activity.save();

    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR reviews and modifies recommendations
exports.updateRecommendations = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { recommendedEmployees } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        recommendedEmployees,
        status: 'hr_reviewed'
      },
      { new: true }
    ).populate('recommendedEmployees.employee');

    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Forward to manager for confirmation
exports.forwardToManager = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { managerId } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        assignedManager: managerId,
        status: 'manager_reviewed'
      },
      { new: true }
    );

    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    await Notification.create({
      userId: managerId,
      title: 'Activité à confirmer',
      message: `Vous avez une nouvelle activité à confirmer: '${activity.title}'.`,
    });

    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Manager confirms final participants
exports.confirmParticipants = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { selectedEmployees } = req.body;

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      {
        selectedEmployees: selectedEmployees.map(empId => ({ employee: empId })),
        status: 'confirmed',
        finalConfirmationBy: req.user._id,
        finalConfirmationDate: new Date()
      },
      { new: true }
    ).populate('selectedEmployees.employee');

    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    // Notify confirmed employees
    for (const selected of activity.selectedEmployees) {
      await Notification.create({
        userId: selected.employee._id,
        title: 'Participation confirmée',
        message: `Votre participation à '${activity.title}' a été confirmée.`,
      });
    }

    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee responds to participation request
exports.respondToInvitation = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { status, justification } = req.body;

    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    const employeeIndex = activity.selectedEmployees.findIndex(
      emp => emp.employee.toString() === req.user._id.toString()
    );

    if (employeeIndex === -1) {
      return res.status(404).json({ message: 'Employee not in selected list' });
    }

    activity.selectedEmployees[employeeIndex].status = status;
    activity.selectedEmployees[employeeIndex].responseDate = new Date();
    if (justification) {
      activity.selectedEmployees[employeeIndex].justification = justification;
    }

    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get activities for current user based on role
exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'HR_MANAGER') {
      query.createdBy = userId;
    } else if (userRole === 'MANAGER') {
      query.assignedManager = userId;
    } else if (userRole === 'EMPLOYEE') {
      query = {
        'selectedEmployees.employee': userId
      };
    }

    const activities = await Activity.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedManager', 'firstName lastName')
      .populate('selectedEmployees.employee', 'firstName lastName email')
      .populate('recommendedEmployees.employee', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Maps French UI labels → model enum values
const SKILL_TYPE_MAP = {
  'savoir':       'KNOWLEDGE',
  'knowledge':    'KNOWLEDGE',
  'savoir-faire': 'KNOW_HOW',
  'know_how':     'KNOW_HOW',
  'know-how':     'KNOW_HOW',
  'savoir-être':  'SOFT_SKILL',
  'soft_skill':   'SOFT_SKILL',
  'soft skill':   'SOFT_SKILL',
};

const SKILL_LEVEL_MAP = {
  'faible':  'LOW',
  'bas':     'LOW',
  'low':     'LOW',
  'moyen':   'MEDIUM',
  'medium':  'MEDIUM',
  'élevé':   'HIGH',
  'eleve':   'HIGH',
  'haut':    'HIGH',
  'high':    'HIGH',
  'expert':  'EXPERT',
};

function normalizeSkills(skills = []) {
  return skills.map(skill => ({
    ...skill,
    type: SKILL_TYPE_MAP[(skill.type || '').toLowerCase()] || skill.type,
    desiredLevel: SKILL_LEVEL_MAP[(skill.desiredLevel || '').toLowerCase()] || skill.desiredLevel,
  }));
}

exports.createActivity = async (req, res) => {
  try {
    const { startDate, endDate, requiredSkills, ...rest } = req.body;

    // --- Date validation ---
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ message: 'La date de début est invalide.' });
      }
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: 'La date de fin est invalide.' });
      }
      if (end <= start) {
        return res.status(400).json({ message: 'La date de fin doit être postérieure à la date de début.' });
      }
    }

    const payload = {
      ...rest,
      startDate,
      endDate,
      requiredSkills: normalizeSkills(requiredSkills),
      createdBy: req.user?._id
    };

    const activity = await Activity.create(payload);

    await Notification.create({
      userId: req.user._id,
      title: 'Activité créée',
      message: `Activité '${activity.title}' créée avec succès.`,
    });

    res.status(201).json(activity);
  } catch (err) {
    // Return Mongoose validation errors as 400 with a readable message
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const { startDate, endDate, requiredSkills, ...rest } = req.body;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        return res.status(400).json({ message: 'La date de fin doit être postérieure à la date de début.' });
      }
    }

    const update = {
      ...rest,
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(requiredSkills !== undefined && { requiredSkills: normalizeSkills(requiredSkills) }),
    };

    const activity = await Activity.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
