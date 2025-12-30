import { Pool } from 'pg';

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in Railway Variables.');
  // Don't crash on startup, but log the error
}

// Log connection info (masked)
if (databaseUrl) {
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log('📦 Database URL configured:', maskedUrl);
}

// Database connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

export default pool;

// Helper function for queries
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

// Helper for single row
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

// Helper for insert/update returning
export async function execute(text: string, params?: any[]): Promise<any> {
  const result = await pool.query(text, params);
  return result;
}
