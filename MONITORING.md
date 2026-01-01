# AMC Tvoj Coffeeshop - Monitoring Guide

## Health Check Endpoints

The server provides several health check endpoints for monitoring:

### 1. Full Health Check
```
GET /api/health
```

Returns comprehensive system status including:
- Database connectivity
- Memory usage
- Environment info
- Basic statistics

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-31T12:00:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "up",
      "latencyMs": 5
    },
    "memory": {
      "heapUsedMB": 50,
      "heapTotalMB": 120,
      "rssMemoryMB": 150
    },
    "environment": {
      "nodeVersion": "v20.10.0",
      "platform": "linux",
      "env": "production"
    }
  },
  "stats": {
    "employeeCount": 10,
    "attendanceCount": 1500,
    "lastAttendance": "2024-12-31T11:55:00.000Z"
  }
}
```

### 2. Simple Ping
```
GET /api/health/ping
```

Quick response to verify server is alive.

### 3. Readiness Check
```
GET /api/health/ready
```

Checks if the server is ready to accept requests (database connected).

### 4. Liveness Check
```
GET /api/health/live
```

Simple check that the process is running.

## Setting Up Uptime Monitoring

### Option 1: UptimeRobot (Free)

1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Create an account
3. Add a new monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.railway.app/api/health/ping`
   - Monitoring interval: 5 minutes
4. Set up alerts (email, SMS, Slack, etc.)

### Option 2: BetterStack (Free tier)

1. Go to [BetterStack](https://betterstack.com/)
2. Create a monitor for your API
3. Configure alert channels

### Option 3: Railway Built-in Monitoring

Railway provides basic metrics:
1. Go to your project in Railway dashboard
2. Select your service
3. View "Metrics" tab for CPU, Memory, and Network usage

## Database Backup Monitoring

### Manual Backup Check

Run the verification script regularly:
```bash
cd server
npm run backup           # Create backup
npm run verify-backup <file>  # Verify against current DB
```

### Automated Backups

Consider setting up a Railway cron job or external cron service:

1. Create a backup endpoint (admin only)
2. Call it daily from an external scheduler
3. Store backups in external storage (S3, etc.)

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Database latency | > 100ms | > 500ms |
| Memory usage | > 80% | > 95% |
| API response time | > 1s | > 5s |
| Uptime | < 99.5% | < 99% |

## Incident Response

### Database Down

1. Check Railway Postgres status
2. Check environment variables
3. Restart the web service
4. Check logs for connection errors

### High Memory Usage

1. Check for memory leaks in logs
2. Restart the service
3. Consider upgrading Railway plan

### API Slow or Timeout

1. Check database latency
2. Review recent code changes
3. Check for network issues
4. Consider database optimization

## Log Monitoring

View logs in Railway:
1. Go to project dashboard
2. Select service
3. Click "Logs" or "Deploy Logs"

Key log patterns to watch:
- `❌` - Errors
- `⚠️` - Warnings
- `[Auto-Checkout]` - Auto checkout job status
- Database connection errors

## Environment Variables Checklist

Ensure these are set in Railway:
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `JWT_SECRET` - Authentication secret
- [ ] `VALID_QR_CODES` - Valid QR codes for scanning
- [ ] `NODE_ENV=production` - Production mode
