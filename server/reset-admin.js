require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function resetPasswords() {
  const hash = await bcrypt.hash('admin123', 10);
  console.log('Generated Hash:', hash);

  // 1. Local DB using .env credentials
  const localPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'stitch_malawi_db',
  });

  try {
    await localPool.query(
      `INSERT INTO admins (username, password_hash) VALUES ('admin', $1) 
       ON CONFLICT (username) DO UPDATE SET password_hash = $1`,
      [hash]
    );
    console.log('✅ Local Admin Password Reset to: admin123');
  } catch (err) {
    console.error('Local DB Error:', err);
  } finally {
    await localPool.end();
  }

  // 2. Cloud Neon DB
  const neonPool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_oBPT6GfvcI4J@ep-winter-smoke-axsdc0qp.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await neonPool.query(
      `INSERT INTO admins (username, password_hash) VALUES ('admin', $1) 
       ON CONFLICT (username) DO UPDATE SET password_hash = $1`,
      [hash]
    );
    console.log('✅ Neon Cloud Admin Password Reset to: admin123');
  } catch (err) {
    console.error('Neon DB Error:', err);
  } finally {
    await neonPool.end();
  }
}

resetPasswords();
