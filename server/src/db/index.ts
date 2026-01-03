import { Pool } from 'pg';

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ DATABASE_URL environment variable is not set!');
  console.warn('   For local development, you can use JSON file storage.');
  console.warn('   For production, set DATABASE_URL in Railway Variables.');
}

// Log connection info (masked)
if (databaseUrl) {
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log('📦 Database URL configured:', maskedUrl);
}

// Database connection pool (only if DATABASE_URL is set)
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}) : null;

// Test connection on startup (only if pool exists)
if (pool) {
  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err.message);
  });
}

export default pool;

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
  const result = await pool.query(text, params);
  return result.rows;
}

// Helper for single row
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

// Helper for insert/update returning
export async function execute(text: string, params?: any[]): Promise<any> {
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
  const result = await pool.query(text, params);
  return result;
}
