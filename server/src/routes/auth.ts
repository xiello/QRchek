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
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/email';

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

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  console.log('🔑 Password reset request received:', { email: req.body.email });
  
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const employee = await findEmployeeByEmail(email);
    
    // Always return success to prevent email enumeration attacks
    if (!employee) {
      console.log('⚠️ Password reset requested for non-existent email:', email);
      return res.json({ 
        message: 'Ak účet s týmto emailom existuje, odoslali sme vám email s inštrukciami na obnovenie hesla.' 
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database (reusing verification_token fields)
    await updateEmployee(employee.id, {
      verificationToken: resetToken,
      verificationTokenExpires: resetTokenExpires.toISOString()
    });

    // Send reset email (non-blocking - don't wait for it)
    sendPasswordResetEmail(employee.email, employee.name, resetToken)
      .then((emailSent) => {
        if (emailSent) {
          console.log('✅ Password reset email sent successfully to:', email);
        } else {
          console.error('❌ Failed to send password reset email to:', email);
        }
      })
      .catch((emailError) => {
        console.error('❌ Error sending password reset email:', emailError);
      });
    
    // Return immediately - don't wait for email
    console.log('✅ Password reset token generated and stored for:', email);

    res.json({ 
      message: 'Ak účet s týmto emailom existuje, odoslali sme vám email s inštrukciami na obnovenie hesla.' 
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  console.log('🔐 Password reset with token received');
  
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find employee by reset token
    const employee = await findEmployeeByVerificationToken(token);
    
    if (!employee) {
      console.log('❌ Invalid reset token');
      return res.status(400).json({ error: 'Neplatný alebo expirovaný odkaz na obnovenie hesla.' });
    }

    // Check if token is expired
    if (employee.verificationTokenExpires) {
      const expiresAt = new Date(employee.verificationTokenExpires);
      if (expiresAt < new Date()) {
        console.log('❌ Expired reset token');
        return res.status(400).json({ error: 'Odkaz na obnovenie hesla expiroval. Požiadajte o nový.' });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Update password and clear reset token
    await updateEmployee(employee.id, {
      password: hashedPassword,
      verificationToken: undefined,
      verificationTokenExpires: undefined
    });

    console.log('✅ Password reset successful for:', employee.email);
    res.json({ message: 'Heslo bolo úspešne zmenené. Môžete sa prihlásiť.' });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/reset-password/:token - Serve password reset page
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  
  // Check if token is valid
  const employee = await findEmployeeByVerificationToken(token);
  
  if (!employee) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Neplatný odkaz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
          .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; max-width: 400px; margin: 20px; }
          h1 { color: #E31B23; }
          a { color: #E31B23; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Neplatný odkaz</h1>
          <p>Tento odkaz na obnovenie hesla je neplatný alebo expiroval.</p>
          <p><a href="/">Späť na úvodnú stránku</a></p>
        </div>
      </body>
      </html>
    `);
  }

  // Check if expired
  if (employee.verificationTokenExpires) {
    const expiresAt = new Date(employee.verificationTokenExpires);
    if (expiresAt < new Date()) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Odkaz expiroval</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
            .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; max-width: 400px; margin: 20px; }
            h1 { color: #E31B23; }
            a { color: #E31B23; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Odkaz expiroval</h1>
            <p>Tento odkaz na obnovenie hesla expiroval.</p>
            <p>Prosím, požiadajte o nový odkaz v aplikácii.</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  // Serve password reset form
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Obnovenie hesla - AMC Tvoj Coffeeshop</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #1a1a1a; color: #fff; }
        .container { text-align: center; padding: 40px; background: #242424; border-radius: 12px; border: 1px solid #333; max-width: 400px; margin: 20px; width: 100%; }
        h1 { color: #fff; margin-bottom: 10px; }
        h1 span { color: #E31B23; }
        .subtitle { color: #888; margin-bottom: 30px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #444; border-radius: 6px; background: #1a1a1a; color: #fff; box-sizing: border-box; font-size: 16px; }
        input:focus { outline: none; border-color: #E31B23; }
        button { width: 100%; padding: 14px; background: #E31B23; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold; margin-top: 10px; }
        button:hover { background: #c41820; }
        button:disabled { background: #666; cursor: not-allowed; }
        .message { padding: 12px; border-radius: 6px; margin-top: 15px; }
        .error { background: #ff000033; color: #ff6b6b; }
        .success { background: #00ff0033; color: #4ade80; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>AM<span>C</span> Tvoj Coffeeshop</h1>
        <p class="subtitle">Obnovenie hesla</p>
        <form id="resetForm">
          <input type="password" id="password" placeholder="Nové heslo" required minlength="6">
          <input type="password" id="confirmPassword" placeholder="Potvrďte heslo" required minlength="6">
          <button type="submit" id="submitBtn">Zmeniť heslo</button>
        </form>
        <div id="message" class="message" style="display: none;"></div>
      </div>
      <script>
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const submitBtn = document.getElementById('submitBtn');
          const message = document.getElementById('message');
          
          if (password !== confirmPassword) {
            message.textContent = 'Heslá sa nezhodujú';
            message.className = 'message error';
            message.style.display = 'block';
            return;
          }
          
          submitBtn.disabled = true;
          submitBtn.textContent = 'Spracovávam...';
          
          try {
            const response = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: '${token}', password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              message.textContent = data.message + ' Môžete zavrieť túto stránku.';
              message.className = 'message success';
              document.getElementById('resetForm').style.display = 'none';
            } else {
              message.textContent = data.error || 'Niečo sa pokazilo';
              message.className = 'message error';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Zmeniť heslo';
            }
          } catch (error) {
            message.textContent = 'Chyba pripojenia. Skúste to znova.';
            message.className = 'message error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Zmeniť heslo';
          }
          
          message.style.display = 'block';
        });
      </script>
    </body>
    </html>
  `);
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

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res) => {
  console.log('🔄 Token refresh request received');
  
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token is required' });
    }

    // Verify the current token (even if expired, we just need to decode it)
    let decoded: { id: string; email: string; name: string; isAdmin: boolean };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error: any) {
      // If the token is expired, try to decode it anyway
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.decode(token) as any;
        if (!decoded) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // Verify the user still exists and is verified
    const employee = await findEmployeeByEmail(decoded.email);
    if (!employee) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    if (!employee.emailVerified) {
      return res.status(403).json({ error: 'Account is not verified' });
    }

    // Generate new token
    const newToken = jwt.sign(
      { id: employee.id, email: employee.email, name: employee.name, isAdmin: employee.isAdmin || false },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Token refreshed for:', decoded.email);
    res.json({
      token: newToken,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        isAdmin: employee.isAdmin || false
      }
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
