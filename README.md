# AMC Tvoj Coffeeshop - Attendance Tracker

Employee attendance tracking system with QR code scanning.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Railway Service                │
│  ┌─────────────────────────────────────┐   │
│  │     Express Server (Node.js)        │   │
│  │  - API endpoints (/api/*)           │   │
│  │  - Web dashboard (/)                │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│  ┌─────────────────────────────────────┐   │
│  │         PostgreSQL Database          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
            ▲
            │ HTTPS
┌───────────┴───────────┐
│    Mobile App (Expo)  │
└───────────────────────┘
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (optional for local dev)

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Web Dashboard
cd ../web && npm install

# Mobile App
cd ../mobile && npm install
```

### 2. Start Development Servers

```bash
# Terminal 1: Server (uses JSON files for local dev)
cd server && npm run dev

# Terminal 2: Web Dashboard
cd web && npm run dev

# Terminal 3: Mobile App
cd mobile && npx expo start
```

## Railway Deployment

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and sign up/login
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Connect your GitHub account and select your repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **New**
2. Select **Database** → **PostgreSQL**
3. Railway will automatically create the database

### Step 3: Configure Environment Variables

In your Railway project settings, add these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | (auto-linked) | Railway links this automatically to PostgreSQL |
| `JWT_SECRET` | `your-secure-random-string` | Generate a secure random string |
| `VALID_QR_CODE` | `QRCHEK-2024-COMPANY` | Your company's valid QR code |
| `NODE_ENV` | `production` | Enables production mode |
| `SMTP_HOST` | `smtp.gmail.com` | Email server for verification emails |
| `SMTP_PORT` | `587` | Email server port |
| `SMTP_USER` | `your-email@gmail.com` | Email username |
| `SMTP_PASS` | `your-app-password` | Email password (use App Password for Gmail) |

### Step 4: Deploy

1. Railway will auto-deploy when you push to GitHub
2. Wait for the build to complete (check deployment logs)
3. After deployment, run the database migration:

```bash
# In Railway dashboard, open the terminal for your service and run:
npm run migrate
```

Or manually create an admin user via PostgreSQL query.

### Step 5: Get Your App URL

1. In Railway, go to your service
2. Click **Settings** → **Generate Domain**
3. Your app will be available at `https://your-app.up.railway.app`

### Step 6: Update Mobile App

1. Open `mobile/src/config/api.ts`
2. Update `PRODUCTION_API_URL` with your Railway URL:

```typescript
const PRODUCTION_API_URL = 'https://your-app.up.railway.app';
```

3. Rebuild the mobile app:

```bash
cd mobile
eas build --platform android  # For Android
eas build --platform ios      # For iOS
```

## Environment Variables

### Required for Production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) |
| `VALID_QR_CODE` | The QR code that employees will scan |
| `NODE_ENV` | Set to `production` |

### Optional

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (Railway sets this automatically) |
| `SMTP_HOST` | SMTP server for emails |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `FRONTEND_URL` | Frontend URL for CORS |

## Creating Admin User

After deployment, create an admin user by running this SQL in your PostgreSQL database:

```sql
INSERT INTO employees (name, email, password_hash, is_admin, email_verified, hourly_rate)
VALUES (
  'Admin',
  'admin@your-domain.com',
  '$2b$10$your-bcrypt-hashed-password',
  TRUE,
  TRUE,
  10.00
);
```

To generate a bcrypt hash for your password, you can use:
```bash
node -e "require('bcrypt').hash('your-password', 10).then(h => console.log(h))"
```

## QR Code Setup

1. Generate a QR code containing the value from `VALID_QR_CODE` environment variable
2. Default is: `QRCHEK-2024-COMPANY`
3. Print and place at your location for employees to scan

## Mobile App Builds

### Development Testing
```bash
cd mobile
npx expo start
```

### Production Builds
```bash
# Android APK
eas build --platform android --profile preview

# iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

## Support

For issues or questions, check the deployment logs in Railway dashboard.
