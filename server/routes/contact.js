const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/contact — public (submit form)
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  try {
    await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, phone || null, subject || null, message]
    );
    res.json({ message: 'Thank you! Your message has been received.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/contact — admin only (view messages)
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM contact_messages ORDER BY received_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/contact/:id/read — admin only
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const result = await query(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/contact/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
