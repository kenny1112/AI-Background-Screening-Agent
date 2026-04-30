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
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { analyzeCandidate, checkRisk };