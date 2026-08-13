const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET activity log
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to log activity (used internally by other routes)
async function logActivity(adminId, adminName, action, entityType, entityId, entityTitle, details = {}) {
  try {
    await query(
      `INSERT INTO activity_log (admin_id, admin_name, action, entity_type, entity_id, entity_title, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, adminName, action, entityType, entityId, entityTitle, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

module.exports = router;
module.exports.logActivity = logActivity;
