-- Blessed Foundation Malawi Database Schema

-- Admin users
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gallery images (admin-managed, with captions)
CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  category VARCHAR(100) DEFAULT 'general',
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Stories & News Articles
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  category VARCHAR(100) DEFAULT 'Community',
  excerpt TEXT,
  body TEXT,
  author TEXT DEFAULT 'Blessed Foundation Team',
  cover_image_id INT REFERENCES gallery_images(id) ON DELETE SET NULL,
  post_type VARCHAR(50) DEFAULT 'story',
  event_date DATE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  photo_id INT REFERENCES gallery_images(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Programmes & Focus Areas
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'heart',
  cover_image_id INT REFERENCES gallery_images(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE programs ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Community';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Blessed Foundation Team';

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  reason TEXT DEFAULT 'General enquiry',
  subject TEXT,
  message TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  amount NUMERIC(12, 2),
  currency VARCHAR(10) DEFAULT 'MWK',
  frequency VARCHAR(20) DEFAULT 'one-time',
  designation VARCHAR(100) DEFAULT 'Where needed most',
  payment_method VARCHAR(50) DEFAULT 'Mobile Money',
  status VARCHAR(20) DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Site settings (key-value store)
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default site settings for Blessed Foundation Malawi
INSERT INTO site_settings (key, value) VALUES
  ('site_name', 'Blessed Foundation Malawi'),
  ('tagline', 'Building hope. Changing lives.'),
  ('hero_heading', 'Building hope. Changing lives.'),
  ('hero_subtext', 'We work alongside communities to create opportunities, support vulnerable people and help build a better future for Malawi.'),
  ('about_intro', 'Blessed Foundation is a Malawian community-focused organisation working to support people, strengthen communities and create opportunities for a better future.'),
  ('about_mission', 'To work directly alongside Malawian communities, providing practical support in education, youth empowerment, healthcare access, and economic self-reliance.'),
  ('about_vision', 'A Malawi where every person and community has the resources, dignity, and opportunities needed to build a self-sustaining and hopeful future.'),
  ('contact_email', 'info@blessedfoundation.mw'),
  ('contact_phone', '+265 990 58 08 53'),
  ('contact_address', 'Blantyre, Malawi (Opposite HHI)'),
  ('facebook_url', '#'),
  ('twitter_url', '#'),
  ('instagram_url', '#'),
  ('stats_communities', '12'),
  ('stats_people', '1,450+'),
  ('stats_projects', '8'),
  ('stats_years', '5+')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Default admin user (password: admin123)
INSERT INTO admins (username, password_hash) VALUES (
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
) ON CONFLICT (username) DO NOTHING;

-- Initial core work areas
INSERT INTO programs (code, title, description, icon, display_order) VALUES
  ('01', 'Education', 'Supporting children and young people through access to learning opportunities, school materials, and educational mentorship.', 'book', 1),
  ('02', 'Community Development', 'Partnering with local leadership on clean water, health support, and community infrastructure initiatives.', 'users', 2),
  ('03', 'Youth Empowerment', 'Equipping young Malawians with vocational skills, leadership training, and practical paths toward self-reliance.', 'compass', 3),
  ('04', 'Family & Community Support', 'Providing targeted relief, nutritional assistance, and home support for vulnerable families and orphans.', 'heart', 4)
ON CONFLICT DO NOTHING;

-- Sample authentic stories with is_published = TRUE
INSERT INTO posts (title, slug, category, excerpt, body, author, post_type, is_published) VALUES
  ('Learning Materials Reach Rural School in Chikwawa', 'learning-materials-chikwawa', 'Education', 'Desks, exercise books, and learning packages delivered directly to primary students in Southern Malawi.', '<p>Through community contributions, over 120 primary school children in Chikwawa received essential learning materials to keep them enrolled and active in school.</p>', 'Blessings Banda', 'story', TRUE),
  ('Community Water Well Restored in Blantyre District', 'community-water-well-blantyre', 'Community', 'Repairing local boreholes ensures clean, safe drinking water for over 300 families.', '<p>Safe drinking water is foundational to community health. Together with village leaders, we repaired two major hand-pumps in Blantyre Rural.</p>', 'Grace Phiri', 'story', TRUE),
  ('Youth Vocational Skills Workshop Wraps Up', 'youth-skills-workshop', 'Youth', 'Fifteen young adults completed introductory carpentry and tailoring skills mentorship.', '<p>Vocational skills provide young people with tangible ways to earn an income and contribute to their local economy.</p>', 'Blessed Foundation Team', 'story', TRUE)
ON CONFLICT (slug) DO UPDATE SET is_published = TRUE;
