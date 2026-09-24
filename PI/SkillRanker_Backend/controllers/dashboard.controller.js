// const Activity = require('../models/Activity');
// const User = require('../models/User');

// exports.getGlobalStats = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments({ isActive: true });
//     const usersByRole = {
//       employees: await User.countDocuments({ role: 'EMPLOYEE', isActive: true }),
//       managers: await User.countDocuments({ role: 'MANAGER', isActive: true }),
//       hrManagers: await User.countDocuments({ role: 'HR_MANAGER', isActive: true }),
//       admins: await User.countDocuments({ role: 'ADMINISTRATOR', isActive: true })
//     };

//     const totalActivities = await Activity.countDocuments();
//     const activitiesByStatus = {
//       draft: await Activity.countDocuments({ status: 'DRAFT' }),
//       open: await Activity.countDocuments({ status: 'OPEN' }),
//       inProgress: await Activity.countDocuments({ status: 'IN_PROGRESS' }),
//       completed: await Activity.countDocuments({ status: 'COMPLETED' }),
//       cancelled: await Activity.countDocuments({ status: 'CANCELLED' })
//     };

//     const activitiesByType = {
//       training: await Activity.countDocuments({ type: 'TRAINING' }),
//       certification: await Activity.countDocuments({ type: 'CERTIFICATION' }),
//       project: await Activity.countDocuments({ type: 'PROJECT' }),
//       mission: await Activity.countDocuments({ type: 'MISSION' }),
//       audit: await Activity.countDocuments({ type: 'AUDIT' })
//     };

//     const activitiesByCategory = {
//       technical: await Activity.countDocuments({ category: 'TECHNICAL' }),
//       management: await Activity.countDocuments({ category: 'MANAGEMENT' }),
//       transversal: await Activity.countDocuments({ category: 'TRANSVERSAL' })
//     };

//     const seatsAgg = await Activity.aggregate([
//       { $match: { status: { $in: ['OPEN', 'IN_PROGRESS'] } } },
//       { $group: { _id: null, totalSeats: { $sum: '$seats' } } }
//     ]);
//     const totalSeats = seatsAgg.length > 0 ? seatsAgg[0].totalSeats : 0;

//     const recentActivities = await Activity.find()
//       .sort({ createdAt: -1 })
//       .limit(5)
//       .select('title type status seats createdAt')
//       .lean();

//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

//     const monthlyActivities = await Activity.aggregate([
//       { $match: { createdAt: { $gte: sixMonthsAgo } } },
//       {
//         $group: {
//           _id: {
//             year: { $year: '$createdAt' },
//             month: { $month: '$createdAt' }
//           },
//           count: { $sum: 1 }
//         }
//       },
//       { $sort: { '_id.year': 1, '_id.month': 1 } }
//     ]);

//     res.json({
//       users: {
//         total: totalUsers,
//         byRole: usersByRole
//       },
//       activities: {
//         total: totalActivities,
//         byStatus: activitiesByStatus,
//         byType: activitiesByType,
//         byCategory: activitiesByCategory,
//         totalSeats,
//         recent: recentActivities,
//         monthly: monthlyActivities
//       }
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getEmployeeResponses = async (req, res) => {
//   try {
//     const activities = await Activity.find({
//       selectedEmployees: { $exists: true, $ne: [] }
//     })
//       .select('title type category selectedEmployees')
//       .lean();

//     const rows = [];

//     for (const activity of activities) {
//       const selectedEmployees = Array.isArray(activity.selectedEmployees)
//         ? activity.selectedEmployees
//         : [];

//       for (const entry of selectedEmployees) {
//         const responseStatus = String(entry?.status || '').toUpperCase();

//         const shouldShow =
//           Boolean(entry?.respondedAt) ||
//           ['ACCEPTED', 'DECLINED', 'REFUSED', 'COMPLETED', 'CERTIFIED', 'IN_PROGRESS'].includes(responseStatus);

//         if (!shouldShow) continue;

//         rows.push({
//           activityId: String(activity._id),
//           activityTitle: activity.title || '',
//           activityType: activity.type || '',
//           activityCategory: activity.category || '',
//           employeeName: entry?.name || 'Employé',
//           employeeEmail: entry?.email || '',
//           responseStatus,
//           justification: entry?.justification || '',
//           selectedAt: entry?.selectedAt || null,
//           respondedAt: entry?.respondedAt || null
//         });
//       }
//     }

//     rows.sort((a, b) => {
//       const da = new Date(a.respondedAt || a.selectedAt || 0).getTime();
//       const db = new Date(b.respondedAt || b.selectedAt || 0).getTime();
//       return db - da;
//     });

//     res.json(rows);
//   } catch (err) {
//     console.error('getEmployeeResponses error:', err);
//     res.status(500).json({ message: err.message || 'Erreur interne.' });
//   }
// };
const Activity = require('../models/Activity');
const User = require('../models/User');
const Employee = require('../models/Employee');

function toPlain(entry) {
  return typeof entry?.toObject === 'function' ? entry.toObject() : { ...(entry || {}) };
}

exports.getGlobalStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const usersByRole = {
      employees: await User.countDocuments({ role: 'EMPLOYEE', isActive: true }),
      managers: await User.countDocuments({ role: 'MANAGER', isActive: true }),
      hrManagers: await User.countDocuments({ role: 'HR_MANAGER', isActive: true }),
      admins: await User.countDocuments({ role: 'ADMINISTRATOR', isActive: true })
    };

    const totalActivities = await Activity.countDocuments();
    const activitiesByStatus = {
      draft: await Activity.countDocuments({ status: 'DRAFT' }),
      open: await Activity.countDocuments({ status: 'OPEN' }),
      inProgress: await Activity.countDocuments({ status: 'IN_PROGRESS' }),
      completed: await Activity.countDocuments({ status: 'COMPLETED' }),
      cancelled: await Activity.countDocuments({ status: 'CANCELLED' })
    };

    const activitiesByType = {
      training: await Activity.countDocuments({ type: 'TRAINING' }),
      certification: await Activity.countDocuments({ type: 'CERTIFICATION' }),
      project: await Activity.countDocuments({ type: 'PROJECT' }),
      mission: await Activity.countDocuments({ type: 'MISSION' }),
      audit: await Activity.countDocuments({ type: 'AUDIT' })
    };

    const activitiesByCategory = {
      technical: await Activity.countDocuments({ category: 'TECHNICAL' }),
      management: await Activity.countDocuments({ category: 'MANAGEMENT' }),
      transversal: await Activity.countDocuments({ category: 'TRANSVERSAL' })
    };

    const seatsAgg = await Activity.aggregate([
      { $match: { status: { $in: ['OPEN', 'IN_PROGRESS'] } } },
      { $group: { _id: null, totalSeats: { $sum: '$seats' } } }
    ]);
    const totalSeats = seatsAgg.length > 0 ? seatsAgg[0].totalSeats : 0;

    const recentActivities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type status seats createdAt')
      .lean();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyActivities = await Activity.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole
      },
      activities: {
        total: totalActivities,
        byStatus: activitiesByStatus,
        byType: activitiesByType,
        byCategory: activitiesByCategory,
        totalSeats,
        recent: recentActivities,
        monthly: monthlyActivities
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getManagerEvaluationTargets = async (req, res) => {
  try {
    const activities = await Activity.find({
      selectedEmployees: { $exists: true, $ne: [] }
    }).select('title type category selectedEmployees').lean();

    const rows = [];

    for (const activity of activities) {
      const selectedEmployees = Array.isArray(activity.selectedEmployees)
        ? activity.selectedEmployees
        : [];

      for (const entry of selectedEmployees) {
        const status = String(entry?.status || '').toUpperCase();

        if (!['COMPLETED', 'CERTIFIED'].includes(status)) continue;

        rows.push({
          activityId: String(activity._id),
          activityTitle: activity.title || '',
          activityType: activity.type || '',
          activityCategory: activity.category || '',
          employeeId: entry?.employeeId || null,
          userId: entry?.userId || null,
          employeeName: entry?.name || 'Employé',
          employeeEmail: entry?.email || '',
          status,
          managerScore: entry?.managerScore ?? null,
          managerComment: entry?.managerComment || '',
          managerEvaluatedAt: entry?.managerEvaluatedAt || null
        });
      }
    }

    rows.sort((a, b) => {
      const da = new Date(b.managerEvaluatedAt || 0).getTime();
      const db = new Date(a.managerEvaluatedAt || 0).getTime();
      return da - db;
    });

    return res.json(rows);
  } catch (err) {
    console.error('getManagerEvaluationTargets error:', err);
    return res.status(500).json({ message: err.message || 'Erreur interne.' });
  }
};

exports.evaluateEmployee = async (req, res) => {
  try {
    const { activityId, employeeId, userId, score, comment } = req.body || {};

    if (!activityId || !score) {
      return res.status(400).json({
        message: 'activityId et score sont requis.'
      });
    }

    if (Number(score) < 1 || Number(score) > 5) {
      return res.status(400).json({
        message: 'Le score doit être entre 1 et 5.'
      });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activité introuvable.' });
    }

    let found = false;

    activity.selectedEmployees = (activity.selectedEmployees || []).map((entry) => {
      const sameUserId =
        userId &&
        String(entry.userId || '') === String(userId);

      const sameEmployeeId =
        employeeId &&
        String(entry.employeeId || '') === String(employeeId);

      if (sameUserId || sameEmployeeId) {
        found = true;
        return {
          ...toPlain(entry),
          managerScore: Number(score),
          managerComment: String(comment || ''),
          managerEvaluatedAt: new Date(),
          managerEvaluatedBy: req.user?._id || null
        };
      }

      return toPlain(entry);
    });

    if (!found) {
      return res.status(404).json({
        message: 'Employé introuvable dans cette activité.'
      });
    }

    await activity.save();

    if (userId) {
      const user = await User.findById(userId);
      if (user?.assignedActivities?.length) {
        user.assignedActivities = user.assignedActivities.map((entry) =>
          String(entry.activityId) === String(activityId)
            ? {
                ...toPlain(entry),
                managerScore: Number(score),
                managerComment: String(comment || ''),
                managerEvaluatedAt: new Date(),
                managerEvaluatedBy: req.user?._id || null
              }
            : toPlain(entry)
        );
        await user.save();
      }
    }

    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (employee?.assignedActivities?.length) {
        employee.assignedActivities = employee.assignedActivities.map((entry) =>
          String(entry.activityId) === String(activityId)
            ? {
                ...toPlain(entry),
                managerScore: Number(score),
                managerComment: String(comment || ''),
                managerEvaluatedAt: new Date(),
                managerEvaluatedBy: req.user?._id || null
              }
            : toPlain(entry)
        );
        await employee.save();
      }
    }

    return res.json({
      message: 'Évaluation enregistrée avec succès.'
    });
  } catch (err) {
    console.error('evaluateEmployee error:', err);
    return res.status(500).json({ message: err.message || 'Erreur interne.' });
  }
};

exports.getEmployeeResponses = async (req, res) => {
  try {
    const activities = await Activity.find({
      selectedEmployees: { $exists: true, $ne: [] }
    })
      .select('title type category selectedEmployees')
      .lean();

    const rows = [];

    for (const activity of activities) {
      const selectedEmployees = Array.isArray(activity.selectedEmployees)
        ? activity.selectedEmployees
        : [];

      for (const entry of selectedEmployees) {
        const responseStatus = String(entry?.status || '').toUpperCase();

        const shouldShow =
          Boolean(entry?.respondedAt) ||
          ['ACCEPTED', 'DECLINED', 'REFUSED', 'COMPLETED', 'CERTIFIED', 'IN_PROGRESS'].includes(responseStatus);

        if (!shouldShow) continue;

        rows.push({
          activityId: String(activity._id),
          activityTitle: activity.title || '',
          activityType: activity.type || '',
          activityCategory: activity.category || '',
          employeeName: entry?.name || 'Employé',
          employeeEmail: entry?.email || '',
          responseStatus,
          justification: entry?.justification || '',
          selectedAt: entry?.selectedAt || null,
          respondedAt: entry?.respondedAt || null
        });
      }
    }

    rows.sort((a, b) => {
      const da = new Date(a.respondedAt || a.selectedAt || 0).getTime();
      const db = new Date(b.respondedAt || b.selectedAt || 0).getTime();
      return db - da;
    });

    res.json(rows);
  } catch (err) {
    console.error('getEmployeeResponses error:', err);
    res.status(500).json({ message: err.message || 'Erreur interne.' });
  }
};

exports.getEmployeeReceivedEvaluations = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const userEmail = String(req.user?.email || '').trim().toLowerCase();

    const user = userId ? await User.findById(userId).lean() : null;
    const employee = await Employee.findOne({
      $or: [
        ...(userId ? [{ userId }] : []),
        ...(userEmail ? [{ email: userEmail }] : [])
      ]
    }).lean();

    const sourceActivities =
      Array.isArray(employee?.assignedActivities) && employee.assignedActivities.length > 0
        ? employee.assignedActivities
        : Array.isArray(user?.assignedActivities)
        ? user.assignedActivities
        : [];

    const rows = sourceActivities
      .filter((entry) => entry?.managerScore || entry?.managerComment)
      .map((entry) => ({
        activityId: String(entry.activityId || ''),
        activityTitle: entry.title || '',
        activityType: entry.type || '',
        activityCategory: entry.category || '',
        status: entry.status || '',
        managerScore: entry.managerScore ?? null,
        managerComment: entry.managerComment || '',
        managerEvaluatedAt: entry.managerEvaluatedAt || null,
        completedAt: entry.completedAt || null,
        certificateUrl: entry.certificateUrl || ''
      }))
      .sort((a, b) => {
        const da = new Date(a.managerEvaluatedAt || 0).getTime();
        const db = new Date(b.managerEvaluatedAt || 0).getTime();
        return db - da;
      });

    return res.json(rows);
  } catch (err) {
    console.error('getEmployeeReceivedEvaluations error:', err);
    return res.status(500).json({ message: err.message || 'Erreur interne.' });
  }
};