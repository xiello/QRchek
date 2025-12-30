# Rebuild Instructions

## ✅ What's Ready

- ✅ Icon added: `mobile/assets/icon.png` (282KB)
- ✅ App name updated: "AMCheck"
- ✅ Web dashboard rebuilt with styling fixes
- ✅ All changes committed

## 📱 Rebuild Mobile App

### Step 1: Navigate to Mobile Directory

```bash
cd ~/Documents/QRchek/mobile
```

### Step 2: Build Android APK

```bash
eas build --platform android --profile preview
```

**What will happen:**
1. EAS will upload your code (including the icon)
2. Build will take 5-10 minutes
3. You'll get a download link when done
4. The new APK will have:
   - App name: "AMCheck"
   - Your custom icon
   - All latest features

### Step 3: Download & Test

1. When build completes, you'll get a URL
2. Open the URL in your browser
3. Download the APK
4. Install on your Android device
5. Verify:
   - App name shows as "AMCheck"
   - Icon appears on home screen
   - All features work correctly

## 🎯 What's New in This Build

- **App Name:** Changed from "AMC Tvoj Coffeeshop" to "AMCheck"
- **Icon:** Your custom AMC logo icon
- **Styling:** Fixed admin dashboard dark theme issues
- **Filter:** "Filter by Employee:" label now visible

## 📝 Notes

- The build runs on Expo's servers (cloud build)
- You can close your terminal after the build starts
- You'll get an email when the build completes
- The icon will automatically be resized for different Android screen densities

## 🚀 After Build

Once you have the new APK:
1. Share the download link with employees
2. They install the new version
3. The app will show "AMCheck" with your icon

---

**Ready to build?** Run the command above in your terminal!

