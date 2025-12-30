# How to Build the Android APK

## Quick Build Steps

1. **Open Terminal** on your Mac

2. **Navigate to the mobile directory:**
   ```bash
   cd /Users/petriky/Documents/QRchek/mobile
   ```

3. **Run the build command:**
   ```bash
   eas build --platform android --profile preview
   ```

4. **When prompted:**
   - "Generate a new Android Keystore?" → Type `y` and press Enter
   - EAS will create the keystore automatically

5. **Wait for the build** (5-10 minutes)
   - The build runs on Expo's servers
   - You'll see progress in the terminal
   - You can close the terminal after it starts (you'll get an email when done)

6. **Get your APK:**
   - When build completes, you'll get a URL
   - Open the URL in your browser
   - Download the APK file
   - Share the download link with employees

## Alternative: Use the Build Script

```bash
cd /Users/petriky/Documents/QRchek
./build-app.sh
```

Then select option 1 (Preview APK).

## Troubleshooting

### If you get "operation not permitted" error:
- Make sure you're in the correct directory
- Try: `cd ~/Documents/QRchek/mobile` (using ~ instead of full path)

### If build fails:
- Check that you're logged into EAS: `eas whoami`
- If not logged in: `eas login`
- Make sure you have internet connection

### If you need to rebuild:
- Just run the same command again
- EAS will reuse your credentials

## What Happens During Build

1. EAS uploads your code to their servers
2. They compile the Android app
3. They sign it with your keystore
4. They provide a download link

The build happens in the cloud, so you don't need Android Studio or any Android tools installed!

