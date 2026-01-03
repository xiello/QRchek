import 'dotenv/config';
import pool from './index';

const schema = `
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2) DEFAULT 5.00,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('arrival', 'departure')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    auto_generated BOOLEAN DEFAULT FALSE,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_verification_token ON employees(verification_token);
`;

async function migrate() {
  console.log('Running database migrations...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
  
  if (!pool) {
    console.error('Database pool not initialized. Set DATABASE_URL environment variable.');
    throw new Error('Database not configured');
  }
  
  try {
    await pool.query(schema);
    
    console.log('Database migration completed successfully!');
    console.log('Tables: employees, attendance');
    console.log('');
    console.log('To create an admin user, run:');
    console.log('  node -e "require(\'bcrypt\').hash(\'yourpassword\', 10).then(h => console.log(h))"');
    console.log('Then INSERT into employees with is_admin=TRUE');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrate;
