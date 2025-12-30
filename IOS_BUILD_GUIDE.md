# iOS Build Guide

## Prerequisites

### 1. Apple Developer Account
- **Cost:** $99/year
- **Sign up at:** https://developer.apple.com/programs/
- You'll need this to:
  - Sign the iOS app
  - Distribute via App Store
  - Test on physical devices

### 2. EAS Account
- You already have this (logged in as `xiollo`)
- EAS handles the build process for you

## iOS Build Options

### Option 1: Build for Simulator (Free, for testing)
**Best for:** Testing the app on your Mac

```bash
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile development
```

This creates a build that runs in the iOS Simulator on your Mac.

### Option 2: Build for Physical Device (Requires Apple Developer Account)
**Best for:** Testing on your iPhone/iPad

```bash
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile preview
```

This creates an IPA file you can install on your device via TestFlight or direct install.

### Option 3: Build for App Store (Requires Apple Developer Account)
**Best for:** Distributing via App Store

```bash
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile production
```

Then submit to App Store:
```bash
eas submit --platform ios
```

## Step-by-Step: Build iOS App

### Step 1: Ensure Apple Developer Account
1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID
3. Enroll in the Apple Developer Program ($99/year)
4. Wait for approval (usually instant, sometimes 24-48 hours)

### Step 2: Configure EAS for iOS
When you run the build command for the first time, EAS will:
1. Ask to generate iOS credentials
2. You'll need to provide your Apple Developer account details
3. EAS will create certificates and provisioning profiles automatically

### Step 3: Build the App

**For Testing (Recommended first):**
```bash
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile preview
```

**What happens:**
- EAS uploads your code
- Builds the iOS app (takes 10-15 minutes)
- Creates an IPA file
- Provides download link

### Step 4: Install on Your iPhone

**Option A: TestFlight (Easiest)**
1. After build completes, run:
   ```bash
   eas submit --platform ios
   ```
2. EAS will upload to App Store Connect
3. Add your Apple ID email to TestFlight testers
4. Install TestFlight app on iPhone
5. Install your app from TestFlight

**Option B: Direct Install (Advanced)**
1. Download the IPA from EAS
2. Use tools like AltStore or Sideloadly
3. Install directly on your device
4. Note: Requires re-signing every 7 days (free) or 1 year (paid developer)

## Current iOS Configuration

Your app is configured with:
- **Bundle ID:** `com.amc.coffeeshop`
- **App Name:** "AMC Tvoj Coffeeshop"
- **Version:** 1.0.0
- **Camera Permission:** Already configured for QR scanning

## Quick Commands

```bash
# Build for iOS Simulator (free)
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile development

# Build for iPhone/iPad (requires $99 Apple Developer)
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile preview

# Build for App Store
cd ~/Documents/QRchek/mobile
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## Distribution Options

### 1. TestFlight (Recommended for Testing)
- **Free** with Apple Developer account
- Up to 10,000 external testers
- Easy installation via TestFlight app
- Automatic updates
- 90-day expiration (can be renewed)

### 2. App Store (For Public Release)
- **Free** with Apple Developer account
- Public distribution
- Automatic updates
- Professional appearance
- Requires App Store review (1-3 days)

### 3. Enterprise Distribution
- Requires Apple Enterprise Program ($299/year)
- For internal company distribution
- No App Store review needed
- More complex setup

## Troubleshooting

### "No Apple Developer account found"
- Make sure you're enrolled in Apple Developer Program
- Verify your Apple ID is linked in EAS
- Run: `eas credentials` to check

### "Bundle ID already exists"
- Your bundle ID `com.amc.coffeeshop` might be taken
- Change it in `mobile/app.json` → `ios.bundleIdentifier`
- Use something unique like: `com.yourcompany.amccoffeeshop`

### Build fails with certificate errors
- EAS will try to auto-generate credentials
- If it fails, run: `eas credentials` to manually configure
- Make sure your Apple Developer account is active

### Can't install on device
- For TestFlight: Make sure you're added as a tester
- For direct install: Check device UDID is registered
- Verify provisioning profile includes your device

## Cost Summary

- **Apple Developer Program:** $99/year (required for device testing & App Store)
- **EAS Build:** Free tier available (limited builds/month)
- **TestFlight:** Free with Apple Developer account
- **App Store:** Free with Apple Developer account

## Recommended Path

1. **Start with Android** (you're doing this now) ✅
   - Free, quick, easy distribution
   - Good for initial rollout

2. **Add iOS later** (if needed)
   - Only if you have iPhone users
   - Requires $99/year investment
   - More complex but professional

3. **TestFlight for iOS testing**
   - Best way to test on iPhone
   - Easy for employees to install
   - Free with Developer account

## Next Steps

1. **If you have Apple Developer account:**
   ```bash
   cd ~/Documents/QRchek/mobile
   eas build --platform ios --profile preview
   ```

2. **If you don't have Apple Developer account:**
   - Sign up at https://developer.apple.com/programs/
   - Wait for approval
   - Then run the build command above

3. **For now, focus on Android:**
   - Android is free and easier
   - Most employees probably have Android
   - You can add iOS later if needed

---

**Note:** iOS builds take longer than Android (10-15 minutes vs 5-10 minutes) and require more setup. If you're just starting out, Android is the fastest path to get employees using the app.

