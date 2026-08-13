const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/settings — public (returns all as key-value object)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM site_settings ORDER BY key');
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/settings/:key — public
router.get('/:key', async (req, res) => {
  try {
    const result = await query('SELECT * FROM site_settings WHERE key = $1', [req.params.key]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setting not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/settings — admin only (bulk update)
router.put('/', auth, async (req, res) => {
  const updates = req.body; // { key: value, ... }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Request body must be a key-value object.' });
  }

  try {
    for (const [key, value] of Object.entries(updates)) {
      await query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }
    res.json({ message: 'Settings updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/settings/:key — admin only
router.patch('/:key', auth, async (req, res) => {
  const { value } = req.body;
  try {
    const result = await query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
       RETURNING *`,
      [req.params.key, value]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
