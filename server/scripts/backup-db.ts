import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database Backup Script
 * Creates a JSON backup of all database tables
 * 
 * Usage: npx ts-node scripts/backup-db.ts [output_path]
 */

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

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

async function backup() {
  console.log('📦 Starting database backup...');
  
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  try {
    // Fetch all employees
    const employeesResult = await pool.query(`
      SELECT id, name, email, password_hash, is_admin, hourly_rate, 
             email_verified, verification_token, verification_token_expires, created_at
      FROM employees
      ORDER BY created_at ASC
    `);
    console.log(`✅ Backed up ${employeesResult.rows.length} employees`);

    // Fetch all attendance records
    const attendanceResult = await pool.query(`
      SELECT id, employee_id, employee_name, type, timestamp, 
             auto_generated, confirmed, created_at
      FROM attendance
      ORDER BY timestamp ASC
    `);
    console.log(`✅ Backed up ${attendanceResult.rows.length} attendance records`);

    // Create backup object
    const backup: BackupData = {
      metadata: {
        backupDate: new Date().toISOString(),
        version: '1.0',
        tables: ['employees', 'attendance']
      },
      employees: employeesResult.rows,
      attendance: attendanceResult.rows
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = process.argv[2] || path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    
    // Write backup file
    fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved to: ${outputPath}`);

    // Calculate file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 Backup size: ${fileSizeKB} KB`);

    // Verify backup is valid JSON
    const verifyData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    if (verifyData.employees && verifyData.attendance && verifyData.metadata) {
      console.log('✅ Backup verified successfully');
    }

    return outputPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run backup
backup()
  .then((path) => {
    console.log('✅ Database backup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  });
