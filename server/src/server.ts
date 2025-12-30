import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Log environment on startup
console.log('='.repeat(50));
console.log('🚀 AMC Tvoj Coffeeshop Server Starting...');
console.log('='.repeat(50));
console.log('Environment:', isProduction ? 'production' : 'development');
console.log('PORT:', PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : '❌ NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : '❌ NOT SET');
console.log('VALID_QR_CODE:', process.env.VALID_QR_CODE ? 'SET' : '❌ NOT SET');
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AMC Tvoj Coffeeshop API is running',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'NOT CONFIGURED'
  });
});

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
});
