# Quick Start Guide

## 1. Start the Server (Required First)

```bash
cd server
npm run dev
```

Server runs on `http://localhost:3000`

## 2. Find Your MacBook's IP Address

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like `192.168.1.xxx`

## 3. Update Mobile App API URL

Edit `mobile/src/services/api.ts` and replace `192.168.1.100` with your actual IP address.

## 4. Start Web Dashboard

```bash
cd web
npm run dev
```

Opens at `http://localhost:5173`

## 5. Start Mobile App

```bash
cd mobile
npm start
```

- Scan QR code with Expo Go app (iOS/Android)
- Or press `i` for iOS Simulator
- Or press `a` for Android Emulator

## 6. Login Credentials

- Username: `admin` / Password: `password123`
- Username: `employee1` / Password: `password123`

## 7. Create a QR Code

Use any QR code generator online with text: `QRCHECK-2024` (or any text)

## Testing Flow

1. Login on mobile app
2. Scan QR code → Records arrival
3. Scan again → Records departure
4. Check web dashboard → See records appear in real-time

