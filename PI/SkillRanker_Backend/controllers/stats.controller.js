const Employee = require('../models/Employee');
const Activity = require('../models/Activity');
const RecommendationHistory = require('../models/RecommendationHistory');

// GET skill progression and coverage stats
exports.getSkillStats = async (req, res) => {
  try {
    const employees = await Employee.find();
    const skillsCount = {};
    const departmentSkills = {};

    employees.forEach(emp => {
      emp.skills.forEach(skill => {
        skillsCount[skill.name] = (skillsCount[skill.name] || 0) + 1;
        if (!departmentSkills[emp.department]) departmentSkills[emp.department] = {};
        departmentSkills[emp.department][skill.name] = (departmentSkills[emp.department][skill.name] || 0) + 1;
      });
    });

    res.json({
      totalSkills: Object.keys(skillsCount).length,
      skillsDistribution: skillsCount,
      departmentCoverage: departmentSkills
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET activity history stats
exports.getActivityStats = async (req, res) => {
  try {
    const activities = await Activity.find();
    const history = await RecommendationHistory.find().populate('activity selectedEmployees');

    const stats = {
      totalActivities: activities.length,
      completedRecommendations: history.length,
      employeeParticipation: {}
    };

    history.forEach(h => {
      h.selectedEmployees.forEach(emp => {
        stats.employeeParticipation[emp] = (stats.employeeParticipation[emp] || 0) + 1;
      });
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};