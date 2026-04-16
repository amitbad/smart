import dotenv from 'dotenv';
import MongoAdapter from './adapters/MongoAdapter.js';
import PostgresAdapter from './adapters/PostgresAdapter.js';
import { connectMongoDB } from '../config/mongodb.js';

dotenv.config();

const DB_TYPE = process.env.DB_TYPE || 'Mongo';

let dbAdapter;

export const initializeDatabase = async () => {
  console.log(`🔧 Initializing database: ${DB_TYPE}`);
  
  if (DB_TYPE === 'Mongo') {
    await connectMongoDB();
    dbAdapter = new MongoAdapter();
    console.log('✅ MongoDB adapter initialized');
  } else if (DB_TYPE === 'Postgres' || DB_TYPE === 'PG') {
    dbAdapter = new PostgresAdapter();
    console.log('✅ PostgreSQL adapter initialized');
  } else {
    throw new Error(`Unsupported DB_TYPE: ${DB_TYPE}. Use 'Mongo', 'Postgres', or 'PG'`);
  }
  
  return dbAdapter;
};

export const getDB = () => {
  if (!dbAdapter) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbAdapter;
};

export const getDBType = () => DB_TYPE;

export default { initializeDatabase, getDB, getDBType };
