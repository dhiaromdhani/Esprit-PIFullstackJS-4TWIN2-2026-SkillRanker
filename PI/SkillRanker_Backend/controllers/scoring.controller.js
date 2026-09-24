const Employee = require('../models/Employee');
const Activity = require('../models/Activity');

const LEVEL_SCORE = { LOW: 20, MEDIUM: 45, HIGH: 70, EXPERT: 90 };
const SCORE_TO_LEVEL = (score) => {
  if (score >= 80) return 'EXPERT';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
};

// 1. Score global d'un employé
exports.calculateEmployeeScore = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employé non trouvé' });

    if (!employee.skills || !employee.skills.length) {
      return res.json({ globalScore: 0, details: [] });
    }

    const typeWeight = { KNOWLEDGE: 1.2, KNOW_HOW: 1.3, SOFT_SKILL: 1.0 };
    let totalWeight = 0, weightedSum = 0;

    const details = employee.skills.map(skill => {
      const w = typeWeight[skill.type] || 1;
      weightedSum += skill.score * w;
      totalWeight += w;
      return { name: skill.name, type: skill.type, level: skill.level, score: skill.score };
    });

    employee.globalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    await employee.save();

    res.json({
      employee: `${employee.firstName} ${employee.lastName}`,
      globalScore: employee.globalScore,
      totalSkills: employee.skills.length,
      details
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Score d'un employé par rapport à une activité
exports.scoreEmployeeForActivity = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employé non trouvé' });
    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Activité non trouvée' });

    const result = computeActivityScore(employee, activity);
    res.json({ employee: `${employee.firstName} ${employee.lastName}`, activity: activity.title, ...result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Mise à jour après participation
exports.updateScoreAfterParticipation = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: 'Employé non trouvé' });
    const activity = await Activity.findById(req.body.activityId);
    if (!activity) return res.status(404).json({ message: 'Activité non trouvée' });

    const { rating, skillsGained, managerFeedback } = req.body;
    const updates = [];

    if (skillsGained && skillsGained.length > 0) {
      for (const gain of skillsGained) {
        const empSkill = employee.skills.find(s => s.name.toLowerCase() === gain.skill.toLowerCase());
        if (empSkill) {
          const oldScore = empSkill.score;
          empSkill.score = Math.min(100, Math.max(0, empSkill.score + gain.scoreDelta));
          empSkill.level = SCORE_TO_LEVEL(empSkill.score);
          if (empSkill.scoreHistory) {
            empSkill.scoreHistory.push({ score: empSkill.score, reason: `Post: ${activity.title} (${gain.scoreDelta >= 0 ? '+' : ''}${gain.scoreDelta})` });
          }
          updates.push({ skill: gain.skill, oldScore, newScore: empSkill.score, newLevel: empSkill.level });
        }
      }
    }

    if (rating && rating >= 4 && activity.requiredSkills) {
      const bonus = rating === 5 ? 5 : 3;
      for (const reqSkill of activity.requiredSkills) {
        const already = skillsGained?.find(g => g.skill.toLowerCase() === reqSkill.name.toLowerCase());
        if (already) continue;
        const empSkill = employee.skills.find(s => s.name.toLowerCase() === reqSkill.name.toLowerCase());
        if (empSkill) {
          const oldScore = empSkill.score;
          empSkill.score = Math.min(100, empSkill.score + bonus);
          empSkill.level = SCORE_TO_LEVEL(empSkill.score);
          updates.push({ skill: reqSkill.name, oldScore, newScore: empSkill.score, autoBonus: true });
        }
      }
    }

    if (employee.participationHistory) {
      employee.participationHistory.push({
        activityId: activity._id, activityTitle: activity.title, date: new Date(),
        evaluation: { completed: true, rating: rating || 0, skillsGained: skillsGained || [], managerFeedback: managerFeedback || '', evaluatedAt: new Date() }
      });
    }

    const typeWeight = { KNOWLEDGE: 1.2, KNOW_HOW: 1.3, SOFT_SKILL: 1.0 };
    let tw = 0, ws = 0;
    for (const s of employee.skills) { const w = typeWeight[s.type] || 1; ws += s.score * w; tw += w; }
    employee.globalScore = tw > 0 ? Math.round(ws / tw) : 0;
    await employee.save();

    res.json({ message: 'Scores mis à jour', globalScore: employee.globalScore, updates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Recalculer tous les scores
exports.recalculateAllScores = async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'ACTIVE' });
    let updated = 0;
    for (const emp of employees) {
      if (!emp.skills || !emp.skills.length) continue;
      const typeWeight = { KNOWLEDGE: 1.2, KNOW_HOW: 1.3, SOFT_SKILL: 1.0 };
      let tw = 0, ws = 0;
      for (const s of emp.skills) { const w = typeWeight[s.type] || 1; ws += s.score * w; tw += w; }
      emp.globalScore = tw > 0 ? Math.round(ws / tw) : 0;
      await emp.save();
      updated++;
    }
    res.json({ message: `Scores recalculés pour ${updated} employés` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const filter = { status: 'ACTIVE' };
    if (req.query.department) filter.department = req.query.department;

    const employees = await Employee.find(filter)
      .select('firstName lastName jobTitle department globalScore skills')
      .populate('department', 'name')
      .sort({ globalScore: -1 })
      .limit(parseInt(req.query.limit) || 20);

    const leaderboard = employees.map((emp, i) => ({
      rank: i + 1,
      _id: emp._id,
      employee: `${emp.firstName} ${emp.lastName}`,
      jobTitle: emp.jobTitle,
      department: emp.department?.name || '—',
      globalScore: emp.globalScore,
      totalSkills: emp.skills ? emp.skills.length : 0,
      topSkills: emp.skills ? emp.skills.sort((a, b) => b.score - a.score).slice(0, 3).map(s => ({ name: s.name, score: s.score, level: s.level })) : []
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HELPER
function computeActivityScore(employee, activity) {
  let skillMatchScore = 0, totalWeight = 0;
  const skillDetails = [];

  if (activity.requiredSkills && activity.requiredSkills.length > 0) {
    for (const req of activity.requiredSkills) {
      const weight = req.weight || 1;
      totalWeight += weight;
      const empSkill = employee.skills ? employee.skills.find(s => s.name.toLowerCase() === req.name.toLowerCase()) : null;
      if (empSkill) {
        const empLvl = LEVEL_SCORE[empSkill.level] || 0;
        const reqLvl = LEVEL_SCORE[req.desiredLevel] || 0;
        const ratio = reqLvl > 0 ? Math.min(empLvl / reqLvl, 1.0) : 0;
        skillMatchScore += ratio * weight;
        skillDetails.push({ skill: req.name, required: req.desiredLevel, current: empSkill.level, matchRatio: Math.round(ratio * 100), weight, status: ratio >= 1 ? 'MATCHED' : ratio >= 0.5 ? 'PARTIAL' : 'GAP' });
      } else {
        skillDetails.push({ skill: req.name, required: req.desiredLevel, current: null, matchRatio: 0, weight, status: 'MISSING' });
      }
    }
  }

  return {
    activityScore: totalWeight > 0 ? Math.round((skillMatchScore / totalWeight) * 100) : 0,
    skillDetails,
    matched: skillDetails.filter(s => s.status === 'MATCHED').length,
    gaps: skillDetails.filter(s => s.status === 'GAP' || s.status === 'MISSING').length
  };
}

exports.computeActivityScore = computeActivityScore;
exports.LEVEL_SCORE = LEVEL_SCORE;