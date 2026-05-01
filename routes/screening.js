const express = require('express');
const router = express.Router();
const { analyzeCandidate, checkRisk } = require('../services/aiService');
const { saveScreening } = require('../services/dbService');

router.post('/analyze-candidate', async (req, res) => {
  try {
    const { name, role, experience, education, employment_history, notes } = req.body;
    if (!name || !role) {
      return res.status(400).json({ error: 'name and role are required' });
    }
    const result = await analyzeCandidate({ name, role, experience, education, employment_history, notes });
    await saveScreening('analyze', name, req.body, result);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

router.post('/check-risk', async (req, res) => {
  try {
    const { name, concern, industry, seniority } = req.body;
    if (!name || !concern) {
      return res.status(400).json({ error: 'name and concern are required' });
    }
    const result = await checkRisk({ name, concern, industry, seniority });
    await saveScreening('risk', name, req.body, result);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Risk check failed', details: err.message });
  }
});

module.exports = router;