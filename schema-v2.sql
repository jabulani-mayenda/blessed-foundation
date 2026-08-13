-- =============================================================
-- Blessed Foundation Malawi — Database Schema V2 Migration
-- Run this AFTER schema.sql (additive only, no destructive ops)
-- =============================================================

-- ─── Enhanced Admin Users (replaces simple admins table) ─────
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS avatar_url TEXT;
UPDATE admins SET email = 'admin@blessedfoundation.mw', full_name = 'Administrator', role = 'super_admin' WHERE username = 'admin';
ALTER TABLE admins ADD CONSTRAINT admins_email_unique UNIQUE (email) DEFERRABLE INITIALLY DEFERRED;

-- ─── Gallery Images enhancements ──────────────────────────────
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS photographer VARCHAR(200);
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS section_key VARCHAR(100);
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ─── Posts / Stories enhancements ─────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time INT DEFAULT 3;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id INT REFERENCES admins(id) ON DELETE SET NULL;
UPDATE posts SET status = CASE WHEN is_published = TRUE THEN 'published' ELSE 'draft' END;

-- ─── Programs enhancements ────────────────────────────────────
ALTER TABLE programs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE programs ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ─── Team Members enhancements ────────────────────────────────
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS facebook VARCHAR(300);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS twitter VARCHAR(300);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS linkedin VARCHAR(300);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ─── Contact Messages enhancements ───────────────────────────
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unread';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
UPDATE contact_messages SET status = CASE WHEN is_read = TRUE THEN 'read' ELSE 'unread' END;

-- ─── Donations enhancements ───────────────────────────────────
ALTER TABLE donations ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS campaign_id INT;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS tx_ref VARCHAR(200);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- ─── Volunteers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  area_of_interest TEXT,
  availability TEXT,
  message TEXT,
  status VARCHAR(30) DEFAULT 'new',
  internal_notes TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug VARCHAR(200) UNIQUE,
  program_id INT REFERENCES programs(id) ON DELETE SET NULL,
  description TEXT,
  full_description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(30) DEFAULT 'active',
  project_lead TEXT,
  budget NUMERIC(14, 2),
  show_location BOOLEAN DEFAULT TRUE,
  show_dates BOOLEAN DEFAULT TRUE,
  show_budget BOOLEAN DEFAULT FALSE,
  cover_image_id INT REFERENCES gallery_images(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Impact Statistics ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS impact_stats (
  id SERIAL PRIMARY KEY,
  number_value VARCHAR(50) NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_on VARCHAR(50) DEFAULT 'both',
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO impact_stats (number_value, label, description, icon, display_order) VALUES
  ('12', 'Communities Reached', 'Communities actively supported across Malawi', 'map-pin', 1),
  ('1,450+', 'People Supported', 'Individuals reached through our programmes', 'users', 2),
  ('8', 'Active Projects', 'Ongoing community development projects', 'briefcase', 3),
  ('5+', 'Years of Work', 'Years serving communities in Malawi', 'calendar', 4)
ON CONFLICT DO NOTHING;

-- ─── Navigation Items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_items (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  href VARCHAR(300) NOT NULL,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  is_cta BOOLEAN DEFAULT FALSE,
  target VARCHAR(20) DEFAULT '_self',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO nav_items (label, href, display_order, is_visible, is_cta) VALUES
  ('Home', '/', 1, TRUE, FALSE),
  ('About', '/about.html', 2, TRUE, FALSE),
  ('Our Work', '/programs.html', 3, TRUE, FALSE),
  ('Impact', '/impact.html', 4, TRUE, FALSE),
  ('Stories', '/stories.html', 5, TRUE, FALSE),
  ('Get Involved', '/get-involved.html', 6, TRUE, FALSE),
  ('Donate', '/donate.html', 7, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ─── Footer Settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS footer_settings (
  id SERIAL PRIMARY KEY,
  org_name TEXT DEFAULT 'Blessed Foundation Malawi',
  description TEXT DEFAULT 'We work alongside communities to create opportunities and build a better future for Malawi.',
  phone TEXT DEFAULT '+265 990 58 08 53',
  email TEXT DEFAULT 'info@blessedfoundation.mw',
  address TEXT DEFAULT 'Blantyre, Malawi',
  facebook_url TEXT DEFAULT '#',
  instagram_url TEXT DEFAULT '#',
  tiktok_url TEXT DEFAULT '#',
  linkedin_url TEXT DEFAULT '#',
  youtube_url TEXT DEFAULT '#',
  twitter_url TEXT DEFAULT '#',
  copyright_text TEXT DEFAULT '© 2026 Blessed Foundation Malawi. All rights reserved.',
  auto_year BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO footer_settings (id, org_name) VALUES (1, 'Blessed Foundation Malawi')
ON CONFLICT (id) DO NOTHING;

-- ─── Page Sections ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_sections (
  id SERIAL PRIMARY KEY,
  page VARCHAR(50) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  label TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  UNIQUE(page, section_key)
);

INSERT INTO page_sections (page, section_key, label, display_order) VALUES
  ('home', 'hero', 'Hero Section', 1),
  ('home', 'intro', 'Introduction', 2),
  ('home', 'work', 'Areas of Work', 3),
  ('home', 'featured-story', 'Featured Story', 4),
  ('home', 'impact', 'Impact Numbers', 5),
  ('home', 'get-involved', 'Get Involved', 6),
  ('home', 'latest-stories', 'Latest Stories', 7),
  ('home', 'cta', 'Final Call to Action', 8)
ON CONFLICT DO NOTHING;

-- ─── SEO Settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_settings (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(100) UNIQUE NOT NULL,
  page_label VARCHAR(100),
  seo_title TEXT,
  seo_description TEXT,
  og_image_id INT REFERENCES gallery_images(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO seo_settings (page_slug, page_label, seo_title, seo_description) VALUES
  ('home', 'Home Page', 'Blessed Foundation Malawi — Building Hope, Changing Lives', 'We work alongside communities to create opportunities and build a better future for Malawi.'),
  ('about', 'About', 'About Blessed Foundation Malawi', 'Learn about our mission, vision and values as we work with communities across Malawi.'),
  ('programs', 'Our Work', 'Our Work — Blessed Foundation Malawi', 'Explore our education, community, youth and family support programmes across Malawi.'),
  ('impact', 'Impact', 'Our Impact — Blessed Foundation Malawi', 'See the real difference our work is making in communities across Malawi.'),
  ('stories', 'Stories', 'Stories — Blessed Foundation Malawi', 'Read community stories from our work across Malawi.'),
  ('contact', 'Contact', 'Contact Blessed Foundation Malawi', 'Get in touch with the Blessed Foundation Malawi team.'),
  ('donate', 'Donate', 'Donate — Support Blessed Foundation Malawi', 'Your donation helps us build hope and change lives across Malawi.')
ON CONFLICT (page_slug) DO NOTHING;

-- ─── Documents / Reports ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  year INT,
  category VARCHAR(50) DEFAULT 'report',
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  is_published BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Activity Log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  admin_name VARCHAR(200),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  entity_title TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Donation Campaigns ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC(14, 2),
  current_amount NUMERIC(14, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  cover_image_id INT REFERENCES gallery_images(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Content Revisions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revisions (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  content JSONB NOT NULL,
  admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  admin_name VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Site Settings additions ──────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('hero_btn1_text', 'Support Our Work'),
  ('hero_btn1_link', '/donate.html'),
  ('hero_btn2_text', 'Learn More'),
  ('hero_btn2_link', '/about.html'),
  ('primary_color', '#3F4A32'),
  ('secondary_color', '#F6F4EC'),
  ('short_name', 'Blessed Foundation'),
  ('org_description', 'Blessed Foundation Malawi is a community-focused organisation working to support people, strengthen communities and create opportunities for a better future.'),
  ('donation_amounts', '5000,10000,25000,50000,100000'),
  ('donation_featured_amount', '25000')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
