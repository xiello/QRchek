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

// Middleware
app.use(cors({
  origin: isProduction 
    ? process.env.FRONTEND_URL || true // Allow any in production or specific URL
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
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production
if (isProduction) {
  const publicPath = path.join(__dirname, '../public');
  
  // Serve static assets
  app.use(express.static(publicPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AMC Tvoj Coffeeshop Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${isProduction ? 'production' : 'development'}`);
});
