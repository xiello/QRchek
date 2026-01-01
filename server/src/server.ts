import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';
import { startAutoCheckoutJob } from './services/autoCheckout';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '***';
    console.log('  Body:', JSON.stringify(bodyCopy));
  }
  next();
});

// Log environment on startup
console.log('='.repeat(50));
console.log('🚀 AMC Tvoj Coffeeshop Server Starting...');
console.log('='.repeat(50));
console.log('Environment:', isProduction ? 'production' : 'development');
console.log('PORT:', PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : '❌ NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : '❌ NOT SET');
console.log('VALID_QR_CODES:', process.env.VALID_QR_CODES || process.env.VALID_QR_CODE ? 'SET' : '❌ NOT SET');
console.log('='.repeat(50));

// Middleware
app.use(cors({
  origin: isProduction 
    ? process.env.FRONTEND_URL || true
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8081'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Serve static files in production
if (isProduction) {
  const publicPath = path.join(__dirname, '../public');
  
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Start the auto-checkout cron job
  if (isProduction || process.env.ENABLE_AUTO_CHECKOUT === 'true') {
    startAutoCheckoutJob();
  } else {
    console.log('⏭️  Auto-checkout job disabled (set ENABLE_AUTO_CHECKOUT=true to enable in dev)');
  }
});
