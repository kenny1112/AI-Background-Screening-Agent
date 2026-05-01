const express = require('express');
const router = express.Router();
const { getHistory } = require('../services/dbService');

router.get('/history', async (req, res) => {
  try {
    const history = await getHistory();
    res.json({ success: true, data: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history', details: err.message });
  }
});

module.exports = router;