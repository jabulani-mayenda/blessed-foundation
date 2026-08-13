const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/programs — public
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, gi.url as cover_url
       FROM programs p
       LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
       WHERE p.is_visible = TRUE
       ORDER BY p.display_order ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/programs/all — admin
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, gi.url as cover_url
       FROM programs p
       LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
       ORDER BY p.display_order ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/programs — admin only
router.post('/', auth, async (req, res) => {
  const { title, description, icon, cover_image_id, display_order } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  try {
    const result = await query(
      `INSERT INTO programs (title, description, icon, cover_image_id, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description || null, icon || 'star', cover_image_id || null, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/programs/:id — admin only
router.patch('/:id', auth, async (req, res) => {
  const { title, description, icon, cover_image_id, display_order, is_visible } = req.body;
  try {
    const result = await query(
      `UPDATE programs SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         icon = COALESCE($3, icon),
         cover_image_id = COALESCE($4, cover_image_id),
         display_order = COALESCE($5, display_order),
         is_visible = COALESCE($6, is_visible)
       WHERE id = $7 RETURNING *`,
      [title, description, icon, cover_image_id, display_order, is_visible, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Program not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/programs/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query('DELETE FROM programs WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Program not found.' });
    res.json({ message: 'Program deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
