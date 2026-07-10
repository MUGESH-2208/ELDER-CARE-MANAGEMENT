// Run with: node seed.js
// Creates a default admin account: username="admin" password="Admin@123"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
  try {
    const hash = await bcrypt.hash('Admin@123', 10);
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);

    if (existing.rows.length > 0) {
      console.log('Admin user already exists. Skipping.');
    } else {
      await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', 'admin@eldercare.local', hash, 'System Administrator', 'admin']
      );
      console.log('Default admin created -> username: admin | password: Admin@123');
      console.log('IMPORTANT: Log in and change this password immediately.');
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
