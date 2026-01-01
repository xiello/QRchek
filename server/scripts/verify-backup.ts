import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';

/**
 * Backup Verification Script
 * Compares a backup file against the current database state
 * 
 * Usage: npx ts-node scripts/verify-backup.ts <backup_file>
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

async function verify(backupPath: string) {
  console.log('🔍 Verifying backup against database...');

  // Check if file exists
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
  }

  // Read backup
  let backup: BackupData;
  try {
    const data = fs.readFileSync(backupPath, 'utf-8');
    backup = JSON.parse(data);
  } catch (error) {
    console.error('❌ Failed to read backup file:', error);
    process.exit(1);
  }

  console.log('\n📋 Backup Information:');
  console.log(`   File: ${backupPath}`);
  console.log(`   Date: ${backup.metadata.backupDate}`);
  console.log(`   Version: ${backup.metadata.version}`);

  try {
    // Get current database counts
    const employeesCount = await pool.query('SELECT COUNT(*) FROM employees');
    const attendanceCount = await pool.query('SELECT COUNT(*) FROM attendance');

    const dbEmployees = parseInt(employeesCount.rows[0].count);
    const dbAttendance = parseInt(attendanceCount.rows[0].count);

    console.log('\n📊 Comparison:');
    console.log('┌──────────────────┬─────────────┬─────────────┐');
    console.log('│ Table            │ Backup      │ Database    │');
    console.log('├──────────────────┼─────────────┼─────────────┤');
    console.log(`│ Employees        │ ${String(backup.employees.length).padStart(11)} │ ${String(dbEmployees).padStart(11)} │`);
    console.log(`│ Attendance       │ ${String(backup.attendance.length).padStart(11)} │ ${String(dbAttendance).padStart(11)} │`);
    console.log('└──────────────────┴─────────────┴─────────────┘');

    // Calculate differences
    const empDiff = dbEmployees - backup.employees.length;
    const attDiff = dbAttendance - backup.attendance.length;

    if (empDiff !== 0 || attDiff !== 0) {
      console.log('\n⚠️  Differences detected:');
      if (empDiff !== 0) {
        console.log(`   - Employees: ${empDiff > 0 ? '+' : ''}${empDiff} since backup`);
      }
      if (attDiff !== 0) {
        console.log(`   - Attendance: ${attDiff > 0 ? '+' : ''}${attDiff} since backup`);
      }
    } else {
      console.log('\n✅ Backup matches current database state');
    }

    // Verify backup integrity
    console.log('\n🔐 Integrity Check:');
    let valid = true;

    // Check for required fields
    if (!backup.metadata || !backup.metadata.backupDate) {
      console.log('   ❌ Missing metadata');
      valid = false;
    } else {
      console.log('   ✅ Metadata present');
    }

    if (!Array.isArray(backup.employees)) {
      console.log('   ❌ Invalid employees data');
      valid = false;
    } else {
      console.log('   ✅ Employees data valid');
    }

    if (!Array.isArray(backup.attendance)) {
      console.log('   ❌ Invalid attendance data');
      valid = false;
    } else {
      console.log('   ✅ Attendance data valid');
    }

    // Check for orphaned records in backup
    const backupEmployeeIds = new Set(backup.employees.map(e => e.id));
    const orphanedRecords = backup.attendance.filter(a => !backupEmployeeIds.has(a.employee_id));
    if (orphanedRecords.length > 0) {
      console.log(`   ⚠️  ${orphanedRecords.length} attendance records reference non-existent employees`);
    } else {
      console.log('   ✅ No orphaned attendance records');
    }

    if (valid) {
      console.log('\n✅ Backup verification completed successfully');
    } else {
      console.log('\n❌ Backup has integrity issues');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Check for backup file argument
const backupPath = process.argv[2];
if (!backupPath) {
  console.error('❌ Usage: npx ts-node scripts/verify-backup.ts <backup_file>');
  process.exit(1);
}

// Run verification
verify(backupPath)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
