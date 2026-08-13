const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all campaigns (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, g.url as cover_url
       FROM campaigns c
       LEFT JOIN gallery_images g ON c.cover_image_id = g.id
       WHERE c.status = 'active'
       ORDER BY c.is_featured DESC, c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all campaigns (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, g.url as cover_url
       FROM campaigns c
       LEFT JOIN gallery_images g ON c.cover_image_id = g.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create campaign
router.post('/', auth, async (req, res) => {
  const { name, description, goal_amount, start_date, end_date, cover_image_id, is_featured } = req.body;
  if (!name) return res.status(400).json({ error: 'Campaign name is required.' });
  try {
    const result = await query(
      `INSERT INTO campaigns (name, description, goal_amount, start_date, end_date, cover_image_id, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, goal_amount || null, start_date || null, end_date || null, cover_image_id || null, is_featured === true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update campaign
router.patch('/:id', auth, async (req, res) => {
  const { name, description, goal_amount, current_amount, status, is_featured, cover_image_id } = req.body;
  try {
    const result = await query(
      `UPDATE campaigns SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         goal_amount = COALESCE($3, goal_amount),
         current_amount = COALESCE($4, current_amount),
         status = COALESCE($5, status),
         is_featured = COALESCE($6, is_featured),
         cover_image_id = COALESCE($7, cover_image_id),
         updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [name, description, goal_amount, current_amount, status, is_featured, cover_image_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM campaigns WHERE id = $1', [req.params.id]);
    res.json({ message: 'Campaign deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
