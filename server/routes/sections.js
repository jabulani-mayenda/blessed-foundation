const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET page sections for a page (public or admin)
router.get('/:page', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM page_sections WHERE page = $1 ORDER BY display_order ASC',
      [req.params.page]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update single section visibility/order
router.patch('/:id', auth, async (req, res) => {
  const { is_visible, display_order } = req.body;
  try {
    const result = await query(
      `UPDATE page_sections SET is_visible = COALESCE($1, is_visible), display_order = COALESCE($2, display_order)
       WHERE id = $3 RETURNING *`,
      [is_visible, display_order, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT reorder page sections
router.put('/reorder', auth, async (req, res) => {
  const { sections } = req.body;
  if (!Array.isArray(sections)) return res.status(400).json({ error: 'sections array required' });
  try {
    for (const sec of sections) {
      await query('UPDATE page_sections SET display_order = $1, is_visible = $2 WHERE id = $3', [
        sec.display_order,
        sec.is_visible !== false,
        sec.id,
      ]);
    }
    res.json({ message: 'Sections reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
