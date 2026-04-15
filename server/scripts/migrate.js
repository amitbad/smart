import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🚀 Starting database migration...\n');

  try {
    const schemaPath = path.join(__dirname, '../config/schema.json');
    const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    for (const table of schemaData.tables) {
      console.log(`📋 Creating table: ${table.name}`);

      const dropTableQuery = `DROP TABLE IF EXISTS ${table.name} CASCADE;`;
      await pool.query(dropTableQuery);
      console.log(`   ✓ Dropped existing table (if any)`);

      const columns = table.columns.map(col => {
        return `${col.name} ${col.type} ${col.constraints.join(' ')}`;
      }).join(', ');

      const createTableQuery = `CREATE TABLE ${table.name} (${columns});`;
      await pool.query(createTableQuery);
      console.log(`   ✓ Table created successfully`);

      if (table.indexes && table.indexes.length > 0) {
        for (const index of table.indexes) {
          const createIndexQuery = `
            CREATE INDEX ${index.name} 
            ON ${table.name} (${index.columns.join(', ')});
          `;
          await pool.query(createIndexQuery);
          console.log(`   ✓ Index created: ${index.name}`);
        }
      }

      console.log('');
    }

    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations();
