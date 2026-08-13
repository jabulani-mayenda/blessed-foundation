const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all impact stats (public)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM impact_stats WHERE is_visible=TRUE ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM impact_stats ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', auth, async (req, res) => {
  const { number_value, label, description, icon, display_on, display_order } = req.body;
  if (!number_value || !label) return res.status(400).json({ error: 'Number and label are required.' });
  try {
    const result = await query(
      'INSERT INTO impact_stats (number_value,label,description,icon,display_on,display_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [number_value, label, description, icon||'star', display_on||'both', display_order||0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update
router.patch('/:id', auth, async (req, res) => {
  const { number_value, label, description, icon, display_on, display_order, is_visible } = req.body;
  try {
    const result = await query(
      `UPDATE impact_stats SET number_value=COALESCE($1,number_value), label=COALESCE($2,label),
       description=COALESCE($3,description), icon=COALESCE($4,icon), display_on=COALESCE($5,display_on),
       display_order=COALESCE($6,display_order), is_visible=COALESCE($7,is_visible), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [number_value, label, description, icon, display_on, display_order, is_visible, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM impact_stats WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
