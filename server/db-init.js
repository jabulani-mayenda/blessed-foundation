require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const adminPool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );
    if (result.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✅ Database "${process.env.DB_NAME}" created.`);
    }
  } finally {
    await adminPool.end();
  }

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await pool.query(schema);
    await pool.query('UPDATE posts SET is_published = TRUE WHERE is_published IS NOT TRUE;');
    console.log('✅ Blessed Foundation Malawi DB initialized successfully.');
  } finally {
    await pool.end();
  }
}

initDatabase().catch(console.error);
