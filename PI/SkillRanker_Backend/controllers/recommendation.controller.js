const axios = require("axios");
const Activity = require("../models/Activity");
const Employee = require("../models/Employee");
const User = require("../models/User");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5000/analyze";

function escapeRegex(value = "") {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeHumanText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function splitFullName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function buildActivityPrompt(activity, extraPrompt = "") {
  const requiredSkills = Array.isArray(activity.requiredSkills)
    ? activity.requiredSkills.map((s) => s?.name).filter(Boolean)
    : [];

  const sections = [
    `Activité RH à pourvoir :`,
    `Titre: ${activity.title || ""}`,
    `Description: ${activity.description || ""}`,
    `Type: ${activity.type || ""}`,
    `Catégorie: ${activity.category || ""}`,
    `Nombre de personnes à recommander: ${activity.seats || 5}`,
    `Compétences requises: ${requiredSkills.length ? requiredSkills.join(", ") : "Aucune précisée"}`,
  ];

  if (extraPrompt && String(extraPrompt).trim()) {
    sections.push(`Instructions supplémentaires du RH: ${String(extraPrompt).trim()}`);
  }

  sections.push(`Retourne exactement ${activity.seats || 5} employés les plus pertinents.`);

  return sections.join("\n");
}

function buildReasonFromMlRow(row) {
  const reasons = [];

  if (typeof row.skill_coverage === "number") {
    reasons.push(`Couverture compétences: ${Math.round(row.skill_coverage * 100)}%`);
  }

  if (typeof row.role_similarity === "number") {
    reasons.push(`Compatibilité rôle: ${Math.round(row.role_similarity * 100)}%`);
  }

  if (Array.isArray(row.missing_skills) && row.missing_skills.length) {
    reasons.push(`Compétences à renforcer: ${row.missing_skills.join(", ")}`);
  }

  return reasons.join(" · ") || "Recommandé par le modèle IA selon le profil et les compétences.";
}

async function findEmployeeFromMlRow(row) {
  const csvId = Number(row.id || row.csvEmployeeId || 0) || null;
  const mlEmail = normalizeEmail(row.email || "");
  const { firstName, lastName } = splitFullName(row.name || "");
  const jobTitle = String(row.jobTitle || "").trim();

  if (csvId) {
    const byCsvId = await Employee.findOne({ csvEmployeeId: csvId });
    if (byCsvId) return byCsvId;
  }

  if (mlEmail) {
    const byEmail = await Employee.findOne({ email: mlEmail });
    if (byEmail) return byEmail;
  }

  if (firstName && lastName && jobTitle) {
    const byNameAndJob = await Employee.findOne({
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
      lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
      jobTitle: { $regex: new RegExp(`^${escapeRegex(jobTitle)}$`, "i") },
    });
    if (byNameAndJob) return byNameAndJob;
  }

  if (firstName && lastName) {
    const byName = await Employee.findOne({
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
      lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
    });
    if (byName) return byName;
  }

  const normalizedMlName = normalizeHumanText(row.name || "");
  if (normalizedMlName) {
    const allEmployees = await Employee.find({}).select(
      "firstName lastName email csvEmployeeId userId jobTitle"
    );
    const fallback =
      allEmployees.find((e) => {
        const empName = normalizeHumanText(
          `${e.firstName || ""} ${e.lastName || ""}`.trim()
        );
        return empName && empName === normalizedMlName;
      }) || null;

    if (fallback) return fallback;
  }

  return null;
}

async function findUserForEmployee(employee, row) {
  const mlEmail = normalizeEmail(row.email || "");
  const { firstName, lastName } = splitFullName(row.name || "");

  if (employee?.userId) {
    const linkedUser = await User.findById(employee.userId);
    if (linkedUser) return linkedUser;
  }

  if (employee?.email) {
    const byEmployeeEmail = await User.findOne({
      email: normalizeEmail(employee.email),
    });
    if (byEmployeeEmail) return byEmployeeEmail;
  }

  if (mlEmail) {
    const byMlEmail = await User.findOne({ email: mlEmail });
    if (byMlEmail) return byMlEmail;
  }

  if (firstName && lastName) {
    const byName = await User.findOne({
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
      lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
      role: "EMPLOYEE",
    });
    if (byName) return byName;
  }

  return null;
}

exports.recommendEmployees = async (req, res) => {
  try {
    const activityId = req.params.activityId;
    const prompt = String(req.body?.prompt || "").trim();

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: "Activité introuvable." });
    }

    const finalPrompt = buildActivityPrompt(activity, prompt);

    const mlResponse = await axios.post(
      ML_SERVICE_URL,
      { prompt: finalPrompt },
      {
        timeout: 120000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const mlEmployees = Array.isArray(mlResponse?.data?.employees)
      ? mlResponse.data.employees
      : [];

    const recommendations = [];

    for (const row of mlEmployees) {
      const employee = await findEmployeeFromMlRow(row);
      const user = await findUserForEmployee(employee, row);

      recommendations.push({
        csvEmployeeId: Number(row.id || row.csvEmployeeId || employee?.csvEmployeeId || 0) || null,
        employeeId: employee?._id || null,
        userId: user?._id || null,
        name:
          row.name ||
          `${employee?.firstName || user?.firstName || ""} ${employee?.lastName || user?.lastName || ""}`.trim() ||
          user?.name ||
          "Employé",
        email: normalizeEmail(row.email || user?.email || employee?.email),
        jobTitle: row.jobTitle || employee?.jobTitle || "",
        currentSkills: row.current_skills || "",
        score: typeof row.score === "number" ? row.score : Number(row.score || 0),
        reason: buildReasonFromMlRow(row),
        matchedInMongo: Boolean(employee || user),
      });
    }

    activity.latestRecommendationPrompt = prompt;
    activity.recommendedEmployees = recommendations.map((r) => ({
      csvEmployeeId: r.csvEmployeeId,
      employeeId: r.employeeId,
      userId: r.userId,
      name: r.name,
      email: r.email,
      jobTitle: r.jobTitle,
      score: r.score,
      reason: r.reason,
      currentSkills: r.currentSkills,
    }));
    await activity.save();

    return res.json({
      activity: {
        _id: activity._id,
        title: activity.title,
        type: activity.type,
        description: activity.description,
        category: activity.category,
        seats: activity.seats,
        requiredSkills: activity.requiredSkills || [],
      },
      meta: {
        prompt,
        modelJustification: mlResponse?.data?.ai_justification || "",
        targetSkills: mlResponse?.data?.target_skills || [],
        targetRoles: mlResponse?.data?.target_roles || [],
        returnedCount: recommendations.length,
        matchedCount: recommendations.filter((r) => r.employeeId || r.userId).length,
      },
      recommendations,
    });
  } catch (err) {
    console.error("Recommendation error full:", err);
    console.error("Recommendation error message:", err.message);
    console.error("Recommendation error code:", err.code);
    console.error("Recommendation error response:", err.response?.data);

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        message:
          "Le service IA est inaccessible. Vérifie que Flask tourne bien sur http://127.0.0.1:5000.",
      });
    }

    if (err.response) {
      return res.status(500).json({
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Erreur du service IA.",
      });
    }

    return res.status(500).json({
      message: err.message || "Erreur inconnue du backend de recommandation.",
    });
  }
};