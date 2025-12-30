import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  findEmployeeByEmail, 
  findEmployeeByVerificationToken,
  addEmployee,
  updateEmployee
} from '../models/attendance';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/email';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// POST /api/auth/register - Register new employee
router.post('/register', async (req, res) => {
  console.log('📝 Registration request received:', { email: req.body.email, name: req.body.name });
  
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('🔍 Checking if email exists...');
    const existingEmployee = await findEmployeeByEmail(email);
    if (existingEmployee) {
      console.log('❌ Email already exists:', email);
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    console.log('👤 Creating employee in database (pending admin verification)...');
    await addEmployee({
      username: email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      emailVerified: false, // Admin needs to verify
      createdAt: new Date().toISOString()
    });
    console.log('✅ Employee created successfully (pending admin verification)');

    console.log('✅ Registration complete, sending response');
    res.status(201).json({
      message: 'Registration successful. Your account is pending admin approval. You will be able to log in once an admin verifies your account.',
      email: email,
      pendingVerification: true
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/verify/:token - Verify email (kept for backward compatibility, but not used)
router.get('/verify/:token', async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Overenie</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
        .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; }
        h1 { color: #E31B23; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Overenie cez email nie je k dispozícii</h1>
        <p>Váš účet musí byť overený administrátorom.</p>
        <p>Prosím, počkajte na overenie.</p>
      </div>
    </body>
    </html>
  `);
});

// POST /api/auth/resend-verification - Not used with admin verification
router.post('/resend-verification', async (req, res) => {
  res.status(400).json({ error: 'Email verification is not used. Please wait for admin approval.' });
});

// POST /api/auth/login - Login with email
router.post('/login', async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      console.log('❌ Employee not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if admin has verified the account
    if (!employee.emailVerified) {
      console.log('⚠️ Account not verified by admin for:', email);
      return res.status(403).json({ 
        error: 'Your account is pending admin approval. Please wait for an admin to verify your account.',
        needsVerification: true,
        email: employee.email
      });
    }

    const token = jwt.sign(
      { id: employee.id, email: employee.email, name: employee.name, isAdmin: employee.isAdmin || false },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Login successful for:', email);
    res.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        isAdmin: employee.isAdmin || false
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
