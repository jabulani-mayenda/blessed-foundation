require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve public site static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/team', require('./routes/team'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/admin-users', require('./routes/admin-users'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/impact', require('./routes/impact'));
app.use('/api/nav', require('./routes/nav'));
app.use('/api/footer', require('./routes/footer'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/seo', require('./routes/seo'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/trash', require('./routes/trash'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/search', require('./routes/search'));
app.use('/api/revisions', require('./routes/revisions'));

// Consolidated Stats Endpoint
app.get('/api/stats', require('./middleware/auth'), async (req, res) => {
  const { query } = require('./db');
  try {
    const [gallery, posts, team, programs, projects, messages, unread, volunteers, donations] = await Promise.all([
      query('SELECT COUNT(*) FROM gallery_images WHERE is_deleted = FALSE'),
      query("SELECT COUNT(*) FROM posts WHERE status = 'published' AND is_deleted = FALSE"),
      query('SELECT COUNT(*) FROM team_members WHERE is_deleted = FALSE'),
      query('SELECT COUNT(*) FROM programs WHERE is_deleted = FALSE'),
      query('SELECT COUNT(*) FROM projects WHERE is_deleted = FALSE'),
      query('SELECT COUNT(*) FROM contact_messages WHERE is_deleted = FALSE'),
      query("SELECT COUNT(*) FROM contact_messages WHERE is_read = FALSE AND is_deleted = FALSE"),
      query("SELECT COUNT(*) FROM volunteers WHERE status = 'new'"),
      query("SELECT COUNT(*), COALESCE(SUM(amount), 0) as total FROM donations WHERE status = 'Completed'"),
    ]);
    res.json({
      gallery: parseInt(gallery.rows[0].count),
      posts: parseInt(posts.rows[0].count),
      team: parseInt(team.rows[0].count),
      programs: parseInt(programs.rows[0].count),
      projects: parseInt(projects.rows[0].count),
      messages: parseInt(messages.rows[0].count),
      unread_messages: parseInt(unread.rows[0].count),
      volunteers_count: parseInt(volunteers.rows[0].count),
      donations_count: parseInt(donations.rows[0].count),
      donations_total: parseFloat(donations.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
});

// SPA fallback for admin
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// SPA fallback for public site
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Blessed Foundation Malawi CMS server running`);
    console.log(`   Public site:  http://localhost:${PORT}`);
    console.log(`   Admin panel:  http://localhost:${PORT}/admin`);
    console.log(`   API:          http://localhost:${PORT}/api\n`);
  });
}

module.exports = app;
