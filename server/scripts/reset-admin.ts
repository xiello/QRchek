import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const email = 'admin@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin exists
    const res = await client.query('SELECT id FROM employees WHERE email = $1', [email]);
    
    if (res.rows.length > 0) {
      // Update existing
      await client.query(
        'UPDATE employees SET password_hash = $1, is_admin = true, email_verified = true WHERE email = $2',
        [hashedPassword, email]
      );
      console.log(`✅ Updated existing admin user '${email}'`);
    } else {
      // Create new
      await client.query(
        `INSERT INTO employees (name, email, password_hash, is_admin, email_verified, hourly_rate)
         VALUES ($1, $2, $3, true, true, 10.00)`,
        ['Admin User', email, hashedPassword]
      );
      console.log(`✅ Created new admin user '${email}'`);
    }
    
    console.log(`\n🔐 Credentials:\nEmail: ${email}\nPassword: ${password}`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdmin();
