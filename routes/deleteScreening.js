const express = require('express');
const router = express.Router();
const { deleteScreening } = require('../services/dbService');

// DELETE /api/screenings/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteScreening(id);

    if (!deleted) {
      return res.status(404).json({ error: `Screening id ${id} not found` });
    }

    res.json({ success: true, message: `Screening id ${id} deleted`, data: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;