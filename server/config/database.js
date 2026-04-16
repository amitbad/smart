import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;

// Only create pool if using PostgreSQL
if (process.env.DB_TYPE === 'Postgres' || process.env.DB_TYPE === 'PG') {
  pool = new Pool({
    host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.PG_PORT || process.env.DB_PORT || 5432,
    database: process.env.PG_DATABASE || process.env.DB_NAME || 'smart_organizer',
    user: process.env.PG_USER || process.env.DB_USER || 'postgres',
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || 'postgress',
  });

  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
  });
}

export default pool;
