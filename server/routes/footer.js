const express = require('express');
const { query } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// GET footer (public)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM footer_settings WHERE id=1');
    if (!result.rows.length) return res.json({});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update footer
router.put('/', auth, async (req, res) => {
  const { org_name, description, phone, email, address, facebook_url, instagram_url, tiktok_url, linkedin_url, youtube_url, twitter_url, copyright_text, auto_year } = req.body;
  try {
    const result = await query(
      `INSERT INTO footer_settings (id, org_name, description, phone, email, address, facebook_url, instagram_url, tiktok_url, linkedin_url, youtube_url, twitter_url, copyright_text, auto_year)
       VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (id) DO UPDATE SET
         org_name=EXCLUDED.org_name, description=EXCLUDED.description, phone=EXCLUDED.phone, email=EXCLUDED.email,
         address=EXCLUDED.address, facebook_url=EXCLUDED.facebook_url, instagram_url=EXCLUDED.instagram_url,
         tiktok_url=EXCLUDED.tiktok_url, linkedin_url=EXCLUDED.linkedin_url, youtube_url=EXCLUDED.youtube_url,
         twitter_url=EXCLUDED.twitter_url, copyright_text=EXCLUDED.copyright_text, auto_year=EXCLUDED.auto_year,
         updated_at=NOW()
       RETURNING *`,
      [org_name, description, phone, email, address, facebook_url, instagram_url, tiktok_url, linkedin_url, youtube_url, twitter_url, copyright_text, auto_year !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
