const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an AI background screening agent.
Analyze candidate information and return ONLY valid JSON — no markdown, no extra text.

Return this exact shape:
{
  "risk_level": "Low" | "Medium" | "High",
  "summary": "2-3 sentence professional analysis",
  "flags": ["flag1", "flag2"],
  "scores": {
    "employment_continuity": 0-10,
    "credential_credibility": 0-10,
    "reference_reachability": 0-10,
    "role_seniority_fit": 0-10
  },
  "recommendations": ["action1", "action2"]
}`;

const FLAG_SEVERITY_RULES = [
  { pattern: /(fraud|forg|criminal|sanction|lawsuit)/i, score: 100 },
  { pattern: /(unverified|cannot verify|unable to verify|insufficient verification)/i, score: 90 },
  { pattern: /(reference|unreachable)/i, score: 80 },
  { pattern: /(gap|employment gap)/i, score: 70 },
  { pattern: /(credential|degree|education)/i, score: 60 }
];

const RECOMMENDATION_SEVERITY_RULES = [
  { pattern: /(reject|escalate|legal|compliance)/i, score: 100 },
  { pattern: /(require|must|documentation|official)/i, score: 90 },
  { pattern: /(verify|verification|cross-check|background check)/i, score: 80 },
  { pattern: /(reference|contact)/i, score: 70 },
  { pattern: /(clarify|explain|follow up)/i, score: 60 }
];

function getRuleScore(text, rules) {
  for (const rule of rules) {
    if (rule.pattern.test(text)) return rule.score;
  }
  return 0;
}

function sortBySeverity(items, rules) {
  if (!Array.isArray(items)) return [];

  return [...items].sort((a, b) => {
    const aScore = getRuleScore(String(a), rules);
    const bScore = getRuleScore(String(b), rules);
    if (aScore !== bScore) return bScore - aScore;
    return String(a).localeCompare(String(b));
  });
}

function normalizeScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(10, Math.max(0, Math.round(num)));
}

function normalizeAnalysisResponse(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {};

  return {
    risk_level: safe.risk_level || 'Medium',
    summary: safe.summary || 'No summary provided.',
    flags: sortBySeverity(safe.flags, FLAG_SEVERITY_RULES),
    scores: {
      employment_continuity: normalizeScore(safe.scores?.employment_continuity),
      credential_credibility: normalizeScore(safe.scores?.credential_credibility),
      reference_reachability: normalizeScore(safe.scores?.reference_reachability),
      role_seniority_fit: normalizeScore(safe.scores?.role_seniority_fit)
    },
    recommendations: sortBySeverity(safe.recommendations, RECOMMENDATION_SEVERITY_RULES)
  };
}

async function analyzeCandidate(candidateData) {
  const prompt = `Analyze this candidate:
Name: ${candidateData.name}
Role: ${candidateData.role}
Experience: ${candidateData.experience} years
Education: ${candidateData.education}
Employment history: ${candidateData.employment_history}
Notes: ${candidateData.notes || 'None'}`;

  return await callGemini(prompt);
}

async function checkRisk(riskData) {
  const prompt = `Run a targeted risk check:
Candidate: ${riskData.name}
Industry: ${riskData.industry}
Seniority: ${riskData.seniority}
Specific concern: ${riskData.concern}`;

  return await callGemini(prompt);
}

async function callGemini(prompt) {
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const fallbackModels = ['gemini-flash-latest', 'gemini-2.0-flash'];
  const modelsToTry = [preferredModel, ...fallbackModels.filter(m => m !== preferredModel)];

  let lastError;

  for (const modelName of modelsToTry) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return normalizeAnalysisResponse(parsed);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

module.exports = { analyzeCandidate, checkRisk };