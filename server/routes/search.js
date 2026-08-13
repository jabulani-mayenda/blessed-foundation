const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET global admin search
router.get('/', auth, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);
  const term = `%${q.trim()}%`;
  try {
    const [posts, projects, gallery, programs, team, documents] = await Promise.all([
      query("SELECT id, title as name, 'story' as type, '/admin/posts.html' as link FROM posts WHERE title ILIKE $1 OR body ILIKE $1", [term]),
      query("SELECT id, name, 'project' as type, '/admin/projects.html' as link FROM projects WHERE name ILIKE $1 OR description ILIKE $1", [term]),
      query("SELECT id, COALESCE(caption, filename) as name, 'image' as type, '/admin/gallery.html' as link FROM gallery_images WHERE caption ILIKE $1 OR filename ILIKE $1", [term]),
      query("SELECT id, title as name, 'program' as type, '/admin/programs.html' as link FROM programs WHERE title ILIKE $1 OR description ILIKE $1", [term]),
      query("SELECT id, name, 'team' as type, '/admin/team.html' as link FROM team_members WHERE name ILIKE $1 OR role ILIKE $1", [term]),
      query("SELECT id, title as name, 'document' as type, '/admin/reports.html' as link FROM documents WHERE title ILIKE $1 OR description ILIKE $1", [term]),
    ]);
    const results = [
      ...posts.rows,
      ...projects.rows,
      ...gallery.rows,
      ...programs.rows,
      ...team.rows,
      ...documents.rows,
    ];
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
