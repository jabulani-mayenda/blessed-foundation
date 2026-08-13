const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// GET all admins
router.get('/', auth, async (req, res) => {
  try {
    const result = await query('SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM admins ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create admin
router.post('/', auth, async (req, res) => {
  const { username, email, full_name, password, role } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: 'Username, email and password are required.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO admins (username, email, full_name, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, full_name, role',
      [username, email, full_name || username, hash, role || 'content_manager']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH update admin
router.patch('/:id', auth, async (req, res) => {
  const { full_name, email, role, is_active } = req.body;
  try {
    const result = await query(
      'UPDATE admins SET full_name=$1, email=$2, role=$3, is_active=$4 WHERE id=$5 RETURNING id, username, email, full_name, role, is_active',
      [full_name, email, role, is_active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Admin not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE admin
router.delete('/:id', auth, async (req, res) => {
  if (parseInt(req.params.id) === req.admin.id) return res.status(400).json({ error: 'Cannot delete your own account.' });
  try {
    await query('DELETE FROM admins WHERE id=$1', [req.params.id]);
    res.json({ message: 'Admin deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
