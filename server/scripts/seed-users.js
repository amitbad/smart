import pool from '../config/database.js';
import bcrypt from 'bcrypt';

async function seedUsers() {
  console.log('🌱 Seeding users table...\n');

  try {
    const hashedPassword = await bcrypt.hash('admin', 10);

    const query = `
      INSERT INTO users (username, password, email, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, email, role
    `;

    const result = await pool.query(query, ['admin', hashedPassword, 'amit@example.com', 'ADMIN']);

    if (result.rows.length > 0) {
      console.log('   ✓ Admin user created successfully');
      console.log('   Username: admin');
      console.log('   Password: admin');
      console.log('   Email: amit@example.com');
      console.log('   Role: ADMIN\n');
    } else {
      console.log('   ℹ Admin user already exists\n');
    }

    console.log('✅ User seeding completed!\n');
  } catch (error) {
    console.error('❌ User seeding failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

seedUsers();
