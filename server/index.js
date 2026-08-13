require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve public site
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin dashboard
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

// Stats endpoint for admin dashboard
app.get('/api/stats', require('./middleware/auth'), async (req, res) => {
  const { query } = require('./db');
  try {
    const [gallery, posts, team, programs, messages, unread, donations] = await Promise.all([
      query('SELECT COUNT(*) FROM gallery_images'),
      query('SELECT COUNT(*) FROM posts'),
      query('SELECT COUNT(*) FROM team_members'),
      query('SELECT COUNT(*) FROM programs'),
      query('SELECT COUNT(*) FROM contact_messages'),
      query('SELECT COUNT(*) FROM contact_messages WHERE is_read = FALSE'),
      query('SELECT COUNT(*), COALESCE(SUM(amount), 0) as total FROM donations'),
    ]);
    res.json({
      gallery: parseInt(gallery.rows[0].count),
      posts: parseInt(posts.rows[0].count),
      team: parseInt(team.rows[0].count),
      programs: parseInt(programs.rows[0].count),
      messages: parseInt(messages.rows[0].count),
      unread_messages: parseInt(unread.rows[0].count),
      donations_count: parseInt(donations.rows[0].count),
      donations_total: parseFloat(donations.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
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

app.listen(PORT, () => {
  console.log(`\n🚀 Blessed Foundation Malawi server running`);
  console.log(`   Public site:  http://localhost:${PORT}`);
  console.log(`   Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`   API:          http://localhost:${PORT}/api\n`);
});
