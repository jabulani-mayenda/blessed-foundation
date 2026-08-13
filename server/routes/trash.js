const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all trash items
router.get('/', auth, async (req, res) => {
  try {
    const [posts, programs, projects, team, documents] = await Promise.all([
      query("SELECT id, title as name, 'story' as type, deleted_at FROM posts WHERE is_deleted = TRUE"),
      query("SELECT id, title as name, 'program' as type, deleted_at FROM programs WHERE is_deleted = TRUE"),
      query("SELECT id, name, 'project' as type, deleted_at FROM projects WHERE is_deleted = TRUE"),
      query("SELECT id, name, 'team' as type, deleted_at FROM team_members WHERE is_deleted = TRUE"),
      query("SELECT id, title as name, 'document' as type, updated_at as deleted_at FROM documents WHERE is_deleted = TRUE"),
    ]);
    const items = [
      ...posts.rows,
      ...programs.rows,
      ...projects.rows,
      ...team.rows,
      ...documents.rows,
    ].sort((a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST restore item
router.post('/restore', auth, async (req, res) => {
  const { type, id } = req.body;
  if (!type || !id) return res.status(400).json({ error: 'Type and id required.' });
  try {
    let table = '';
    if (type === 'story') table = 'posts';
    else if (type === 'program') table = 'programs';
    else if (type === 'project') table = 'projects';
    else if (type === 'team') table = 'team_members';
    else if (type === 'document') table = 'documents';
    else return res.status(400).json({ error: 'Invalid entity type.' });

    await query(`UPDATE ${table} SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1`, [id]);
    res.json({ message: 'Item restored successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE permanent purge
router.delete('/purge', auth, async (req, res) => {
  const { type, id } = req.body;
  if (!type || !id) return res.status(400).json({ error: 'Type and id required.' });
  try {
    let table = '';
    if (type === 'story') table = 'posts';
    else if (type === 'program') table = 'programs';
    else if (type === 'project') table = 'projects';
    else if (type === 'team') table = 'team_members';
    else if (type === 'document') table = 'documents';
    else return res.status(400).json({ error: 'Invalid entity type.' });

    await query(`DELETE FROM ${table} WHERE id = $1 AND is_deleted = TRUE`, [id]);
    res.json({ message: 'Item permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
