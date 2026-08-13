const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/team — public
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, gi.url as photo_url
       FROM team_members t
       LEFT JOIN gallery_images gi ON t.photo_id = gi.id
       WHERE t.is_visible = TRUE
       ORDER BY t.display_order ASC, t.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/team/all — admin (includes hidden)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, gi.url as photo_url
       FROM team_members t
       LEFT JOIN gallery_images gi ON t.photo_id = gi.id
       ORDER BY t.display_order ASC, t.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/team — admin only
router.post('/', auth, async (req, res) => {
  const { name, role, bio, photo_id, display_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  try {
    const result = await query(
      `INSERT INTO team_members (name, role, bio, photo_id, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, role || null, bio || null, photo_id || null, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/team/:id — admin only
router.patch('/:id', auth, async (req, res) => {
  const { name, role, bio, photo_id, display_order, is_visible } = req.body;
  try {
    const result = await query(
      `UPDATE team_members SET
         name = COALESCE($1, name),
         role = COALESCE($2, role),
         bio = COALESCE($3, bio),
         photo_id = COALESCE($4, photo_id),
         display_order = COALESCE($5, display_order),
         is_visible = COALESCE($6, is_visible)
       WHERE id = $7 RETURNING *`,
      [name, role, bio, photo_id, display_order, is_visible, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team member not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/team/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query('DELETE FROM team_members WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Team member not found.' });
    res.json({ message: 'Team member deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
