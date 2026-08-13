const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/donations — Submit donation
router.post('/', async (req, res) => {
  const { donor_name, donor_email, donor_phone, amount, frequency, designation, payment_method } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid donation amount.' });
  }

  try {
    const result = await query(
      `INSERT INTO donations (donor_name, donor_email, donor_phone, amount, frequency, designation, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [donor_name || 'Anonymous', donor_email || null, donor_phone || null, parseFloat(amount), frequency || 'one-time', designation || 'Where needed most', payment_method || 'Mobile Money']
    );

    res.status(201).json({
      message: 'Thank you for your generous support! Your contribution helps build hope across Malawi.',
      donation: result.rows[0],
    });
  } catch (err) {
    console.error('Donation error:', err);
    res.status(500).json({ error: 'Server error processing donation.' });
  }
});

// GET /api/donations — Admin only
router.get('/', auth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM donations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
