const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all volunteers
router.get('/', auth, async (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM volunteers';
  const params = [];
  if (status) { sql += ' WHERE status = $1'; params.push(status); }
  sql += ' ORDER BY received_at DESC';
  try {
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single volunteer
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM volunteers WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create volunteer (public form submission)
router.post('/', async (req, res) => {
  const { name, email, phone, area_of_interest, availability, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
  try {
    const result = await query(
      'INSERT INTO volunteers (name, email, phone, area_of_interest, availability, message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, email, phone, area_of_interest, availability, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update status/notes
router.patch('/:id', auth, async (req, res) => {
  const { status, internal_notes } = req.body;
  try {
    const result = await query(
      'UPDATE volunteers SET status=COALESCE($1,status), internal_notes=COALESCE($2,internal_notes), updated_at=NOW() WHERE id=$3 RETURNING *',
      [status, internal_notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE volunteer
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM volunteers WHERE id=$1', [req.params.id]);
    res.json({ message: 'Volunteer record deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
