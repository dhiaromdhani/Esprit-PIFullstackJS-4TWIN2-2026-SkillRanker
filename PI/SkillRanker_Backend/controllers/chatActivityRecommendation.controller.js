const axios = require('axios');
const Activity = require('../models/Activity');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000/analyze';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRequestedCount(prompt = '') {
  const text = String(prompt || '').toLowerCase();

  const patterns = [
    /(?:je\s*veux|donne(?:r)?|affiche|cherche|trouve)\s*(\d+)\s*(?:employees?|employés?|employer|personne|personnes|people|profils?|candidats?)/i,
    /(?:top|exactement)\s*(\d+)\s*(?:employees?|employés?|employer|personne|personnes|people|profils?|candidats?)/i,
    /(\d+)\s*(?:employees?|employés?|employer|personne|personnes|people|profils?|candidats?)/i,
    /(?:personne|personnes|people)\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const n = Number(match[1]);
      if (n > 0) return n;
    }
  }

  return 5;
}

function extractActivityTerm(prompt = '') {
  const text = String(prompt || '').trim();

  const patterns = [
    /(?:activité|activite)\s+([a-zA-Z0-9À-ÿ+._ -]+)/i,
    /(?:pour)\s+l['’]activité\s+([a-zA-Z0-9À-ÿ+._ -]+)/i,
    /(?:sur)\s+l['’]activité\s+([a-zA-Z0-9À-ÿ+._ -]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/[,.;!?]+$/g, '')
        .replace(/\b(top|exactement)\s+\d+\s+(employees?|employés?|employer|personne|personnes|people|profils?|candidats?)\b/gi, '')
        .replace(/\b\d+\s+(employees?|employés?|employer|personne|personnes|people|profils?|candidats?)\b/gi, '')
        .trim();
    }
  }

  const countPatterns = [
    /(?:je\s*veux|donne(?:r)?|affiche|cherche|trouve)\s*\d+\s*(?:employees?|employés?|employer|personne|personnes|people|profils?|candidats?)\s*(?:pour|sur)\s+(.+)/i,
    /(?:top|exactement)\s*\d+\s*(?:employees?|employés?|employer|personne|personnes|people|profils?|candidats?)\s*(?:pour|sur)\s+(.+)/i,
    /^(.+?)\s+\d+\s*(?:employees?|employés?|employer|personne|personnes|people|profils?|candidats?)$/i
  ];

  for (const pattern of countPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/[,.;!?]+$/g, '')
        .replace(/\b(l['’]activité|activité|activite)\b/gi, '')
        .trim();
    }
  }

  return text.trim();
}

async function findActivityFromPrompt(prompt = '') {
  const term = extractActivityTerm(prompt);
  if (!term) return null;

  const exact = await Activity.findOne({
    title: { $regex: new RegExp(`^${escapeRegex(term)}$`, 'i') }
  }).sort({ createdAt: -1 });

  if (exact) return exact;

  const loose = await Activity.findOne({
    $or: [
      { title: { $regex: new RegExp(escapeRegex(term), 'i') } },
      { description: { $regex: new RegExp(escapeRegex(term), 'i') } },
      { 'requiredSkills.name': { $regex: new RegExp(escapeRegex(term), 'i') } }
    ]
  }).sort({ createdAt: -1 });

  return loose;
}

function buildActivityPrompt(activity, originalPrompt = '', requestedCount = 5) {
  const requiredSkills = Array.isArray(activity.requiredSkills)
    ? activity.requiredSkills.map((s) => s?.name).filter(Boolean)
    : [];

  return [
    `Activité RH à pourvoir :`,
    `Titre: ${activity.title || ''}`,
    `Description: ${activity.description || ''}`,
    `Type: ${activity.type || ''}`,
    `Catégorie: ${activity.category || ''}`,
    `Nombre de personnes à recommander: ${requestedCount}`,
    `Compétences requises: ${requiredSkills.length ? requiredSkills.join(', ') : 'Aucune précisée'}`,
    `Demande RH via chat: ${String(originalPrompt || '').trim()}`,
    `Retourne exactement ${requestedCount} employés les plus pertinents.`
  ].join('\n');
}

exports.analyzeExistingActivityFromChat = async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ message: 'prompt est requis.' });
    }

    const requestedCount = parseRequestedCount(prompt);
    const activity = await findActivityFromPrompt(prompt);

    if (!activity) {
      return res.status(404).json({
        message: "Aucune activité existante n'a été trouvée dans MongoDB à partir du prompt."
      });
    }

    const finalPrompt = buildActivityPrompt(activity, prompt, requestedCount);

    const mlResponse = await axios.post(
      ML_SERVICE_URL,
      { prompt: finalPrompt },
      {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const employees = Array.isArray(mlResponse?.data?.employees)
      ? mlResponse.data.employees.slice(0, requestedCount)
      : [];

    return res.json({
      activityId: activity._id,
      activity: {
        _id: activity._id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        category: activity.category,
        seats: activity.seats,
        requiredSkills: activity.requiredSkills || []
      },
      requested_count: requestedCount,
      returned_count: employees.length,
      ai_justification: mlResponse?.data?.ai_justification || '',
      target_skills: mlResponse?.data?.target_skills || [],
      target_roles: mlResponse?.data?.target_roles || [],
      employees
    });
  } catch (error) {
    console.error('analyzeExistingActivityFromChat error:', error);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'Le service IA est inaccessible.'
      });
    }

    return res.status(500).json({
      message: error.message || 'Erreur interne.'
    });
  }
};