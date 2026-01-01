import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as readline from 'readline';

/**
 * Database Restore Script
 * Restores database from a JSON backup file
 * 
 * Usage: npx ts-node scripts/restore-db.ts <backup_file>
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Create pool with SSL for production
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

interface BackupData {
  metadata: {
    backupDate: string;
    version: string;
    tables: string[];
  };
  employees: any[];
  attendance: any[];
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function restore(backupPath: string) {
  console.log('🔄 Starting database restore...');
  console.log(`📁 Reading backup from: ${backupPath}`);

  // Check if file exists
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  // Read and parse backup
  let backup: BackupData;
  try {
    const data = fs.readFileSync(backupPath, 'utf-8');
    backup = JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to read backup file:', error);
    process.exit(1);
  }

  // Display backup info
  console.log('\n📋 Backup Information:');
  console.log(`   Date: ${backup.metadata.backupDate}`);
  console.log(`   Version: ${backup.metadata.version}`);
  console.log(`   Employees: ${backup.employees.length}`);
  console.log(`   Attendance records: ${backup.attendance.length}`);

  // Confirm restore
  console.log('\n⚠️  WARNING: This will DELETE all existing data and replace it with backup data!');
  const confirmed = await askConfirmation('Are you sure you want to continue? (y/N): ');
  
  if (!confirmed) {
    console.log('❌ Restore cancelled');
    process.exit(0);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Delete existing data (in correct order due to foreign keys)
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM employees');

    // Restore employees
    console.log('👥 Restoring employees...');
    for (const emp of backup.employees) {
      await client.query(`
        INSERT INTO employees (id, name, email, password_hash, is_admin, hourly_rate, 
                               email_verified, verification_token, verification_token_expires, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        emp.id, emp.name, emp.email, emp.password_hash, emp.is_admin, emp.hourly_rate,
        emp.email_verified, emp.verification_token, emp.verification_token_expires, emp.created_at
      ]);
    }
    console.log(`✅ Restored ${backup.employees.length} employees`);

    // Restore attendance
    console.log('📋 Restoring attendance records...');
    for (const record of backup.attendance) {
      await client.query(`
        INSERT INTO attendance (id, employee_id, employee_name, type, timestamp, 
                                auto_generated, confirmed, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        record.id, record.employee_id, record.employee_name, record.type, record.timestamp,
        record.auto_generated || false, record.confirmed || false, record.created_at
      ]);
    }
    console.log(`✅ Restored ${backup.attendance.length} attendance records`);

    await client.query('COMMIT');
    console.log('\n✅ Database restore completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Restore failed, changes rolled back:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Check for backup file argument
const backupPath = process.argv[2];
if (!backupPath) {
  console.error('❌ Usage: npx ts-node scripts/restore-db.ts <backup_file>');
  process.exit(1);
}

// Run restore
restore(backupPath)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  });
