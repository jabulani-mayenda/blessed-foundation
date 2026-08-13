const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now();
}

// GET /api/posts — public
router.get('/', async (req, res) => {
  try {
    const { type, limit, offset } = req.query;
    let sql = `
      SELECT p.*, gi.url as cover_url, gi.caption as cover_caption
      FROM posts p
      LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      sql += ` AND p.post_type = $${params.length}`;
    }
    sql += ' ORDER BY p.created_at DESC';
    if (limit) {
      params.push(parseInt(limit));
      sql += ` LIMIT $${params.length}`;
    }
    if (offset) {
      params.push(parseInt(offset));
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/posts/:slug — public
router.get('/:slug', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, gi.url as cover_url, gi.caption as cover_caption
       FROM posts p
       LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
       WHERE p.slug = $1`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/posts — admin only
router.post('/', auth, async (req, res) => {
  const { title, excerpt, body, category, author, cover_image_id, post_type, event_date, is_published } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });

  const slug = generateSlug(title);
  try {
    const result = await query(
      `INSERT INTO posts (title, slug, category, excerpt, body, author, cover_image_id, post_type, event_date, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, slug, category || 'Community', excerpt, body, author || 'Blessed Foundation Team', cover_image_id || null, post_type || 'story', event_date || null, is_published !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/posts/:id — admin only
router.patch('/:id', auth, async (req, res) => {
  const { title, excerpt, body, category, author, cover_image_id, post_type, event_date, is_published } = req.body;
  try {
    const result = await query(
      `UPDATE posts SET
         title = COALESCE($1, title),
         excerpt = COALESCE($2, excerpt),
         body = COALESCE($3, body),
         category = COALESCE($4, category),
         author = COALESCE($5, author),
         cover_image_id = COALESCE($6, cover_image_id),
         post_type = COALESCE($7, post_type),
         event_date = COALESCE($8, event_date),
         is_published = COALESCE($9, is_published),
         updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [title, excerpt, body, category, author, cover_image_id, post_type, event_date, is_published, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/posts/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query('DELETE FROM posts WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
