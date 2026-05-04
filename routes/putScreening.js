const express = require('express');
const router = express.Router();
const { updateScreening } = require('../services/dbService');

// PUT /api/screenings/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { risk_level, summary, flags, scores, recommendations } = req.body;

    if (!risk_level && !summary && !flags && !scores && !recommendations) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    const updated = await updateScreening(id, { risk_level, summary, flags, scores, recommendations });

    if (!updated) {
      return res.status(404).json({ error: `Screening id ${id} not found` });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

module.exports = router;