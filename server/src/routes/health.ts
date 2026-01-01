import express from 'express';
import { query } from '../db';

const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
    memory: {
      heapUsedMB: number;
      heapTotalMB: number;
      rssMemoryMB: number;
    };
    environment: {
      nodeVersion: string;
      platform: string;
      env: string;
    };
  };
  stats?: {
    employeeCount: number;
    attendanceCount: number;
    lastAttendance?: string;
  };
}

// GET /api/health - Detailed health check
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    checks: {
      database: { status: 'up' },
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMemoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || 'development',
      },
    },
  };

  // Check database connectivity
  try {
    const dbStartTime = Date.now();
    const result = await query('SELECT 1');
    const dbLatency = Date.now() - dbStartTime;
    
    health.checks.database = {
      status: 'up',
      latencyMs: dbLatency,
    };

    // Get basic stats if database is healthy
    try {
      const [empCount, attCount, lastAtt] = await Promise.all([
        query('SELECT COUNT(*) as count FROM employees'),
        query('SELECT COUNT(*) as count FROM attendance'),
        query('SELECT timestamp FROM attendance ORDER BY timestamp DESC LIMIT 1'),
      ]);

      health.stats = {
        employeeCount: parseInt(empCount[0]?.count || '0'),
        attendanceCount: parseInt(attCount[0]?.count || '0'),
        lastAttendance: lastAtt[0]?.timestamp?.toISOString(),
      };
    } catch (statsError) {
      console.error('Error getting health stats:', statsError);
    }
  } catch (dbError: any) {
    health.checks.database = {
      status: 'down',
      error: dbError.message,
    };
    health.status = 'unhealthy';
  }

  // Check for memory warnings
  const heapUsedPct = health.checks.memory.heapUsedMB / health.checks.memory.heapTotalMB;
  if (heapUsedPct > 0.9) {
    health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(health);
});

// GET /api/health/ping - Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: new Date().toISOString() });
});

// GET /api/health/ready - Readiness check
router.get('/ready', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// GET /api/health/live - Liveness check
router.get('/live', (req, res) => {
  res.json({ live: true });
});

export default router;
