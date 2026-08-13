const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const slugify = require('slugify');
const router = express.Router();

// GET all projects (public: published only)
router.get('/', async (req, res) => {
  const isAdmin = req.headers.authorization;
  const whereClause = isAdmin ? '' : "WHERE p.is_published = TRUE AND p.is_deleted = FALSE";
  try {
    const result = await query(`
      SELECT p.*, pr.title AS program_name, gi.url AS cover_url
      FROM projects p
      LEFT JOIN programs pr ON p.program_id = pr.id
      LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
      ${whereClause}
      ORDER BY p.display_order ASC, p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all (admin)
router.get('/all', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, pr.title AS program_name, gi.url AS cover_url
      FROM projects p
      LEFT JOIN programs pr ON p.program_id = pr.id
      LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
      WHERE p.is_deleted = FALSE
      ORDER BY p.display_order ASC, p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
router.get('/:slug', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, pr.title AS program_name, gi.url AS cover_url
      FROM projects p
      LEFT JOIN programs pr ON p.program_id = pr.id
      LEFT JOIN gallery_images gi ON p.cover_image_id = gi.id
      WHERE (p.slug=$1 OR p.id=$2) AND p.is_deleted = FALSE
    `, [req.params.slug, parseInt(req.params.slug) || 0]);
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project
router.post('/', auth, async (req, res) => {
  const { name, program_id, description, full_description, location, start_date, end_date, status, project_lead, budget, show_location, show_dates, show_budget, cover_image_id, featured, display_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required.' });
  const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();
  try {
    const result = await query(
      `INSERT INTO projects (name,slug,program_id,description,full_description,location,start_date,end_date,status,project_lead,budget,show_location,show_dates,show_budget,cover_image_id,featured,display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name, slug, program_id||null, description, full_description, location, start_date||null, end_date||null, status||'active', project_lead, budget||null, show_location!==false, show_dates!==false, show_budget===true, cover_image_id||null, featured===true, display_order||0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update project
router.patch('/:id', auth, async (req, res) => {
  const { name, program_id, description, full_description, location, start_date, end_date, status, project_lead, budget, show_location, show_dates, show_budget, cover_image_id, featured, display_order, is_published } = req.body;
  try {
    const result = await query(
      `UPDATE projects SET name=COALESCE($1,name), program_id=COALESCE($2,program_id), description=COALESCE($3,description),
       full_description=COALESCE($4,full_description), location=COALESCE($5,location), start_date=COALESCE($6::date,start_date),
       end_date=COALESCE($7::date,end_date), status=COALESCE($8,status), project_lead=COALESCE($9,project_lead),
       budget=COALESCE($10::numeric,budget), show_location=COALESCE($11,show_location), show_dates=COALESCE($12,show_dates),
       show_budget=COALESCE($13,show_budget), cover_image_id=COALESCE($14,cover_image_id), featured=COALESCE($15,featured),
       display_order=COALESCE($16,display_order), is_published=COALESCE($17,is_published), updated_at=NOW()
       WHERE id=$18 RETURNING *`,
      [name, program_id||null, description, full_description, location, start_date||null, end_date||null, status, project_lead, budget||null, show_location, show_dates, show_budget, cover_image_id||null, featured, display_order, is_published, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft)
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('UPDATE projects SET is_deleted=TRUE, deleted_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ message: 'Moved to trash.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
