const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET nav items (public)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM nav_items WHERE is_visible=TRUE ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM nav_items ORDER BY display_order ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create nav item
router.post('/', auth, async (req, res) => {
  const { label, href, display_order, is_visible, is_cta } = req.body;
  if (!label || !href) return res.status(400).json({ error: 'Label and link are required.' });
  try {
    const result = await query(
      'INSERT INTO nav_items (label,href,display_order,is_visible,is_cta) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [label, href, display_order||0, is_visible!==false, is_cta===true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update single item
router.patch('/:id', auth, async (req, res) => {
  const { label, href, display_order, is_visible, is_cta } = req.body;
  try {
    const result = await query(
      `UPDATE nav_items SET label=COALESCE($1,label), href=COALESCE($2,href),
       display_order=COALESCE($3,display_order), is_visible=COALESCE($4,is_visible), is_cta=COALESCE($5,is_cta)
       WHERE id=$6 RETURNING *`,
      [label, href, display_order, is_visible, is_cta, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT bulk reorder
router.put('/reorder', auth, async (req, res) => {
  const { items } = req.body; // [{id, display_order}]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required.' });
  try {
    for (const item of items) {
      await query('UPDATE nav_items SET display_order=$1 WHERE id=$2', [item.display_order, item.id]);
    }
    res.json({ message: 'Reordered.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE nav item
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM nav_items WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
