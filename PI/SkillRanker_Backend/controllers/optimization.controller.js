const Employee = require('../models/Employee');
const Activity = require('../models/Activity');
const { computeActivityScore, LEVEL_SCORE } = require('./scoring.controller');

// 1. Sélection optimisée multi-critères
exports.optimizeSelection = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Activité non trouvée' });

    const employees = await Employee.find({ status: 'ACTIVE' }).populate('department', 'name');

    const weights = {
      skillMatch:   req.body.weightSkillMatch   || 0.40,
      progression:  req.body.weightProgression  || 0.15,
      priority:     req.body.weightPriority     || 0.25,
      experience:   req.body.weightExperience   || 0.10,
      availability: req.body.weightAvailability || 0.10
    };

    const scored = [];
    for (const emp of employees) {
      const actScore = computeActivityScore(emp, activity);
      const sm = actScore.activityScore / 100;
      const pr = calcProgression(emp);
      const pi = calcPriority(emp, activity.priorityContext);
      const ex = Math.min((emp.yearsOfExperience || 0) / 10, 1.0);
      const av = calcAvailability(emp);

      const combined = sm * weights.skillMatch + pr * weights.progression + pi * weights.priority + ex * weights.experience + av * weights.availability;

      scored.push({
        employee: { _id: emp._id, name: `${emp.firstName} ${emp.lastName}`, jobTitle: emp.jobTitle, department: emp.department?.name || '—', globalScore: emp.globalScore },
        scores: { skillMatch: r(sm), progression: r(pr), priority: r(pi), experience: r(ex), availability: r(av), combined: r(combined) },
        skillDetails: actScore.skillDetails,
        matched: actScore.matched,
        gaps: actScore.gaps
      });
    }

    scored.sort((a, b) => b.scores.combined - a.scores.combined);
    resolveConflicts(scored);

    const seats = activity.seats || 5;
    res.json({
      activity: { _id: activity._id, title: activity.title, type: activity.type, seats, priorityContext: activity.priorityContext },
      weights,
      totalCandidates: employees.length,
      selected: scored.slice(0, seats),
      alternates: scored.slice(seats, seats + 3)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Simulation de scénarios
exports.simulateWeights = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Activité non trouvée' });
    const { scenarios } = req.body;
    if (!scenarios || !scenarios.length) return res.status(400).json({ message: 'Fournir au moins un scénario' });

    const employees = await Employee.find({ status: 'ACTIVE' });
    const results = [];

    for (const sc of scenarios) {
      const scored = [];
      for (const emp of employees) {
        const actScore = computeActivityScore(emp, activity);
        const combined = (actScore.activityScore / 100) * (sc.weightSkillMatch || 0.4)
          + calcProgression(emp) * (sc.weightProgression || 0.15)
          + calcPriority(emp, activity.priorityContext) * (sc.weightPriority || 0.25)
          + Math.min((emp.yearsOfExperience || 0) / 10, 1.0) * (sc.weightExperience || 0.1)
          + calcAvailability(emp) * (sc.weightAvailability || 0.1);
        scored.push({ name: `${emp.firstName} ${emp.lastName}`, combined: r(combined) });
      }
      scored.sort((a, b) => b.combined - a.combined);
      results.push({ scenario: sc.name || 'Sans nom', top5: scored.slice(0, 5) });
    }

    res.json({ activity: activity.title, simulations: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3. Analyse des gaps
exports.analyzeGaps = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: 'Activité non trouvée' });
    if (!activity.requiredSkills || !activity.requiredSkills.length) return res.json({ gaps: [] });

    const employees = await Employee.find({ status: 'ACTIVE' });
    const gaps = [];

    for (const reqSkill of activity.requiredSkills) {
      let hasSkill = 0, meetsLevel = 0, totalScore = 0;
      for (const emp of employees) {
        const es = emp.skills ? emp.skills.find(s => s.name.toLowerCase() === reqSkill.name.toLowerCase()) : null;
        if (es) {
          hasSkill++;
          totalScore += es.score;
          if ((LEVEL_SCORE[es.level] || 0) >= (LEVEL_SCORE[reqSkill.desiredLevel] || 0)) meetsLevel++;
        }
      }
      gaps.push({
        skill: reqSkill.name, type: reqSkill.type, requiredLevel: reqSkill.desiredLevel, weight: reqSkill.weight || 1,
        coverage: { hasSkill, meetsLevel, total: employees.length, coveragePercent: employees.length > 0 ? r2(hasSkill / employees.length) : 0, qualifiedPercent: employees.length > 0 ? r2(meetsLevel / employees.length) : 0 },
        averageScore: hasSkill > 0 ? Math.round(totalScore / hasSkill) : 0,
        severity: meetsLevel === 0 ? 'CRITICAL' : meetsLevel < 3 ? 'HIGH' : meetsLevel < 10 ? 'MEDIUM' : 'LOW'
      });
    }

    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    gaps.sort((a, b) => order[a.severity] - order[b.severity]);
    res.json({ activity: activity.title, totalEmployees: employees.length, gaps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HELPERS
function r(v) { return Math.round(v * 100); }
function r2(v) { return Math.round(v * 100); }

function calcProgression(emp) {
  if (!emp.skills || !emp.skills.length) return 50;
  let up = 0, total = 0;
  for (const s of emp.skills) {
    if (s.scoreHistory && s.scoreHistory.length >= 2) {
      total++;
      if (s.scoreHistory[s.scoreHistory.length - 1].score > s.scoreHistory[s.scoreHistory.length - 2].score) up++;
    }
  }
  return total > 0 ? up / total : 0.5;
}

function calcPriority(emp, ctx) {
  const avg = emp.globalScore || 0;
  if (ctx === 'UPSKILLING') return avg <= 30 ? 1.0 : avg <= 50 ? 0.7 : avg <= 70 ? 0.3 : 0.1;
  if (ctx === 'EXPERTISE') return avg >= 80 ? 1.0 : avg >= 60 ? 0.7 : avg >= 40 ? 0.3 : 0.1;
  if (ctx === 'DEVELOPMENT') return (avg >= 40 && avg <= 70) ? 1.0 : (avg >= 30 && avg <= 80) ? 0.6 : 0.2;
  return 0.5;
}

function calcAvailability(emp) {
  if (!emp.participationHistory) return 1.0;
  const active = emp.participationHistory.filter(p => !p.evaluation || !p.evaluation.completed).length;
  if (active === 0) return 1.0;
  if (active === 1) return 0.7;
  if (active === 2) return 0.4;
  return 0.1;
}

function resolveConflicts(scored) {
  for (let i = 0; i < scored.length - 1; i++) {
    if (scored[i].scores.combined === scored[i + 1].scores.combined) {
      const a = scored[i].scores, b = scored[i + 1].scores;
      if (b.skillMatch > a.skillMatch || (a.skillMatch === b.skillMatch && b.progression > a.progression)) {
        [scored[i], scored[i + 1]] = [scored[i + 1], scored[i]];
      }
    }
  }
}