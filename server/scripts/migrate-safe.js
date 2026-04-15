import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSafeMigrations() {
  console.log('🚀 Starting safe migration process...\n');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Migration tracking table ready\n');

    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('✓ Created migrations directory\n');
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ No migration files found in migrations directory\n');
      return;
    }

    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      
      const result = await pool.query(
        'SELECT * FROM schema_migrations WHERE migration_name = $1',
        [migrationName]
      );

      if (result.rows.length > 0) {
        console.log(`⏭  Skipping ${migrationName} (already applied)`);
        continue;
      }

      console.log(`📋 Running migration: ${migrationName}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      await pool.query('BEGIN');
      
      try {
        await pool.query(sql);
        
        await pool.query('COMMIT');
        console.log(`   ✓ Migration ${migrationName} completed successfully\n`);
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ Migration ${migrationName} failed:`, error.message);
        throw error;
      }
    }

    console.log('✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runSafeMigrations();
