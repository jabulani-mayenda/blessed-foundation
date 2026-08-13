const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all SEO settings
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, g.url as og_image_url
      FROM seo_settings s
      LEFT JOIN gallery_images g ON s.og_image_id = g.id
      ORDER BY s.page_label ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single page SEO
router.get('/:slug', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, g.url as og_image_url
       FROM seo_settings s
       LEFT JOIN gallery_images g ON s.og_image_id = g.id
       WHERE s.page_slug = $1`,
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'SEO settings not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update SEO settings for page
router.put('/:slug', auth, async (req, res) => {
  const { seo_title, seo_description, og_image_id } = req.body;
  try {
    const result = await query(
      `INSERT INTO seo_settings (page_slug, seo_title, seo_description, og_image_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (page_slug) DO UPDATE SET
         seo_title = EXCLUDED.seo_title,
         seo_description = EXCLUDED.seo_description,
         og_image_id = EXCLUDED.og_image_id,
         updated_at = NOW()
       RETURNING *`,
      [req.params.slug, seo_title, seo_description, og_image_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
