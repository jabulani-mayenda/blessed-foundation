const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET public documents/reports
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM documents WHERE is_published = TRUE AND is_deleted = FALSE ORDER BY year DESC, display_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all documents (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM documents WHERE is_deleted = FALSE ORDER BY year DESC, display_order ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload/add document
router.post('/', auth, async (req, res) => {
  const { title, description, year, category, file_url, file_name, file_size, is_published } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });
  try {
    const result = await query(
      `INSERT INTO documents (title, description, year, category, file_url, file_name, file_size, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, year || new Date().getFullYear(), category || 'report', file_url, file_name, file_size || 0, is_published !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update document
router.patch('/:id', auth, async (req, res) => {
  const { title, description, year, category, file_url, is_published } = req.body;
  try {
    const result = await query(
      `UPDATE documents SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         year = COALESCE($3, year),
         category = COALESCE($4, category),
         file_url = COALESCE($5, file_url),
         is_published = COALESCE($6, is_published),
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, description, year, category, file_url, is_published, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft) document
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('UPDATE documents SET is_deleted = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document moved to trash.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
