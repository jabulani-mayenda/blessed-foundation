const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET revisions for entity
router.get('/:type/:id', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM revisions WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT 20',
      [req.params.type, req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST restore revision
router.post('/restore/:revisionId', auth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM revisions WHERE id = $1', [req.params.revisionId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Revision not found.' });
    const rev = result.rows[0];
    const content = rev.content;

    if (rev.entity_type === 'story') {
      await query(
        `UPDATE posts SET title = $1, excerpt = $2, body = $3, updated_at = NOW() WHERE id = $4`,
        [content.title, content.excerpt, content.body, rev.entity_id]
      );
    }
    res.json({ message: 'Revision restored successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
