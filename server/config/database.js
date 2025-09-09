import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Users table removed per latest requirements
import { createEmployerTableSQL } from '../models/Employer.js';
import { createEmployeeTableSQL } from '../models/Employee.js';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required but not set. Please configure your AWS database URL.');
  process.exit(1);
}

const shouldUseSsl = String(process.env.PGSSL || '').toLowerCase() === 'true'
  || String(process.env.PGSSLMODE || '').toLowerCase() === 'require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL database connected successfully');
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Query executed successfully (duration: ${duration}ms, rows: ${res.rowCount})`);
    return res;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
};

export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;

// Resolve path to init.sql (ESM-safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ensureSchemaInitialized = async () => {
  try {
    // Ensure employer and employee tables exist
    console.log('Schema check: ensuring employer table exists...');
    await query(createEmployerTableSQL);
    console.log('Schema check: ensuring employee table exists...');
    await query(createEmployeeTableSQL);
    console.log('Schema init: employer and employee tables ensured.');
  } catch (error) {
    console.error('Schema init error:', error.message);
    throw error;
  }
};
