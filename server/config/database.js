import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
const initSqlPath = path.resolve(__dirname, '../init.sql');

export const ensureSchemaInitialized = async () => {
  try {
    const checkSql = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists;
    `;
    const { rows } = await query(checkSql);
    const exists = rows?.[0]?.exists === true;

    if (exists) {
      console.log('Schema check: users table already exists.');
      return;
    }

    console.log('Schema check: users table missing. Creating from init.sql...');
    const sql = await fs.readFile(initSqlPath, 'utf8');
    await query(sql);
    console.log('Schema init: users table and triggers created successfully.');
  } catch (error) {
    console.error('Schema init error:', error.message);
    throw error;
  }
};
