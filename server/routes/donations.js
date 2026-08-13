const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all donations (admin)
router.get('/', auth, async (req, res) => {
  const { status, campaign_id, format } = req.query;
  let sql = 'SELECT * FROM donations WHERE 1=1';
  const params = [];
  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  if (campaign_id) {
    params.push(campaign_id);
    sql += ` AND campaign_id = $${params.length}`;
  }
  sql += ' ORDER BY created_at DESC';

  try {
    const result = await query(sql, params);

    if (format === 'csv') {
      const csvRows = [
        ['ID', 'Donor Name', 'Donor Email', 'Donor Phone', 'Amount', 'Currency', 'Frequency', 'Designation', 'Payment Method', 'Status', 'Date'],
        ...result.rows.map(r => [
          r.id,
          `"${r.donor_name || 'Anonymous'}"`,
          `"${r.donor_email || ''}"`,
          `"${r.donor_phone || ''}"`,
          r.amount,
          r.currency || 'MWK',
          r.frequency,
          `"${r.designation}"`,
          r.payment_method,
          r.status,
          r.created_at ? new Date(r.created_at).toISOString() : '',
        ]),
      ];
      const csvString = csvRows.map(row => row.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="donations.csv"');
      return res.send(csvString);
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit donation
router.post('/', async (req, res) => {
  const { donor_name, donor_email, donor_phone, amount, currency, frequency, designation, payment_method, is_anonymous } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid donation amount is required.' });
  const reference = 'BFM-' + Date.now().toString(36).toUpperCase();
  try {
    const result = await query(
      `INSERT INTO donations (donor_name, donor_email, donor_phone, amount, currency, frequency, designation, payment_method, is_anonymous, reference, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Completed') RETURNING *`,
      [donor_name || 'Anonymous', donor_email, donor_phone, amount, currency || 'MWK', frequency || 'one-time', designation || 'Where needed most', payment_method || 'Paychangu Mobile Money', is_anonymous === true, reference]
    );
    res.status(201).json({ message: 'Donation recorded successfully', donation: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
