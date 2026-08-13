const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// GET /api/gallery — public
router.get('/', async (req, res) => {
  try {
    const { category, visible_only, section_key } = req.query;
    let sql = 'SELECT * FROM gallery_images WHERE 1=1';
    const params = [];

    if (visible_only !== 'false') {
      sql += ' AND is_visible = TRUE';
    }
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (section_key) {
      params.push(section_key);
      sql += ` AND section_key = $${params.length}`;
    }
    sql += ' ORDER BY display_order ASC, uploaded_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/gallery/section/:key — get first image for a named section
router.get('/section/:key', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM gallery_images WHERE section_key = $1 AND is_visible = TRUE ORDER BY display_order ASC, uploaded_at DESC LIMIT 1',
      [req.params.key]
    );
    if (result.rows.length === 0) return res.json(null);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/gallery/categories — public
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM gallery_images WHERE is_visible = TRUE ORDER BY category'
    );
    res.json(result.rows.map((r) => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/gallery/:id — public
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM gallery_images WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/gallery — admin only (upload image)
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

  const { caption, alt_text, category, display_order } = req.body;
  const filename = req.file.filename;
  const url = `/uploads/${filename}`;

  try {
    const result = await query(
      `INSERT INTO gallery_images (filename, url, caption, alt_text, category, display_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [filename, url, caption || null, alt_text || null, category || 'general', display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PATCH /api/gallery/:id — admin only (update caption/metadata)
router.patch('/:id', auth, async (req, res) => {
  const { caption, alt_text, category, section_key, display_order, is_visible } = req.body;
  try {
    const result = await query(
      `UPDATE gallery_images 
       SET caption = COALESCE($1, caption),
           alt_text = COALESCE($2, alt_text),
           category = COALESCE($3, category),
           section_key = COALESCE($4, section_key),
           display_order = COALESCE($5, display_order),
           is_visible = COALESCE($6, is_visible)
       WHERE id = $7 RETURNING *`,
      [caption, alt_text, category, section_key, display_order, is_visible, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/gallery/:id — admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM gallery_images WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found.' });

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads', result.rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Image deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
