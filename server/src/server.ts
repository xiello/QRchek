import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import adminRoutes from './routes/admin';
import healthRoutes from './routes/health';
import { startAutoCheckoutJob } from './services/autoCheckout';
import { config, validateConfig } from './config/env';

validateConfig();

const app = express();
const PORT = config.PORT;
const isProduction = config.isProduction;

if (isProduction) {
  app.set('trust proxy', 1);
}

const corsOrigins = config.CORS_ORIGINS;

console.log('='.repeat(50));
console.log('QRchek Server Starting...');
console.log('='.repeat(50));
console.log('Environment:', isProduction ? 'production' : 'development');
console.log('PORT:', PORT);
console.log('DATABASE_URL:', config.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('JWT_SECRET: SET');
console.log('CORS Origins:', corsOrigins.length > 0 ? corsOrigins.join(', ') : 'NONE (same-origin only)');
console.log('Rate Limiting: ENABLED');
console.log('='.repeat(50));

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
}));

app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : false,
  credentials: true
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());

app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '***';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, bodyCopy);
  }
  next();
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Serve static files (both production and local dev)
const publicPath = path.join(__dirname, '../public');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else if (isProduction) {
  console.warn('⚠️  Public directory not found! Web dashboard will not be available.');
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
