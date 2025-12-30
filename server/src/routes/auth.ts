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
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists (async)
    const existingEmployee = await findEmployeeByEmail(email);
    if (existingEmployee) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create new employee (async)
    await addEmployee({
      username: email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      createdAt: new Date().toISOString()
    });

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/verify/:token - Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const employee = await findEmployeeByVerificationToken(token);
    if (!employee) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Overenie zlyhalo</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
            .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; }
            h1 { color: #E31B23; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Overenie zlyhalo</h1>
            <p>Neplatný alebo expirovaný overovací odkaz.</p>
            <p>Prosím, vyžiadajte si nový overovací email.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (employee.verificationTokenExpires && new Date(employee.verificationTokenExpires) < new Date()) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Odkaz expiroval</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
            .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; }
            h1 { color: #E31B23; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Odkaz expiroval</h1>
            <p>Tento overovací odkaz už nie je platný.</p>
            <p>Prosím, vyžiadajte si nový overovací email.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Update employee to verified (async)
    await updateEmployee(employee.id, {
      emailVerified: true,
      verificationToken: undefined,
      verificationTokenExpires: undefined
    });

    // Send welcome email
    await sendWelcomeEmail(employee.email, employee.name);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email overený</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
          .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; }
          h1 { color: #4CAF50; }
          .checkmark { font-size: 60px; color: #4CAF50; }
          .logo { color: #fff; font-size: 24px; margin-bottom: 20px; }
          .logo span { color: #E31B23; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">AM<span>C</span> Tvoj Coffeeshop</div>
          <div class="checkmark">✓</div>
          <h1>Email overený!</h1>
          <p>Váš účet bol úspešne overený.</p>
          <p>Teraz sa môžete prihlásiť do aplikácie.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return res.json({ message: 'If an account exists with this email, a verification email has been sent.' });
    }

    if (employee.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await updateEmployee(employee.id, {
      verificationToken,
      verificationTokenExpires
    });

    await sendVerificationEmail(email, employee.name, verificationToken);

    res.json({ message: 'Verification email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login - Login with email
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, employee.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!employee.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true,
        email: employee.email
      });
    }

    const token = jwt.sign(
      { id: employee.id, email: employee.email, name: employee.name, isAdmin: employee.isAdmin || false },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
