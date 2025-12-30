# Android APK Installation Troubleshooting

## Common Issues & Solutions

### Issue 1: "Unsupported file" or "Can't open file"

**Solution: Enable "Install from Unknown Sources"**

1. **On Android 8.0+ (Oreo and newer):**
   - Go to **Settings** → **Apps** → **Special access** → **Install unknown apps**
   - Find your browser (Chrome, Firefox, etc.)
   - Toggle **"Allow from this source"** ON

2. **On older Android versions:**
   - Go to **Settings** → **Security**
   - Enable **"Unknown sources"** or **"Install unknown apps"**

### Issue 2: "App not installed" or "Package appears to be invalid"

**Possible causes:**
- APK file is corrupted (download again)
- Device architecture mismatch
- Insufficient storage space

**Solutions:**
1. **Re-download the APK** from EAS build page
2. **Check storage space** - need at least 50MB free
3. **Try a different browser** to download (Chrome, Firefox, etc.)

### Issue 3: "Parse error" or "There was a problem parsing the package"

**Solutions:**
1. **Download the APK directly** (don't use download managers)
2. **Check file size** - should be around 20-50MB
3. **Try downloading on a computer**, then transfer to phone via USB/email

### Issue 4: "App not compatible with your device"

**Possible causes:**
- Android version too old (need Android 6.0+)
- Architecture mismatch (ARM vs x86)

**Check your Android version:**
- Settings → About phone → Android version
- Need Android 6.0 (Marshmallow) or newer

## Step-by-Step Installation Guide

### Method 1: Direct Download to Phone

1. **Open the EAS build link** on your Android phone
2. **Download the APK** file
3. **Open your phone's file manager** (Files app)
4. **Navigate to Downloads** folder
5. **Tap the APK file**
6. **If prompted**, tap "Install anyway" or "Allow"
7. **Wait for installation** (30-60 seconds)
8. **Tap "Open"** when done

### Method 2: Download on Computer, Transfer to Phone

1. **Download APK on your computer** from EAS build page
2. **Transfer to phone** via:
   - **Email:** Email yourself the APK, open on phone
   - **USB:** Connect phone, copy APK to phone
   - **Cloud:** Upload to Google Drive/Dropbox, download on phone
   - **AirDroid/ShareIt:** Use file transfer app

3. **On phone:** Open file manager, find the APK, tap to install

### Method 3: Using ADB (Advanced)

If you have Android Debug Bridge installed:
```bash
adb install path/to/app.apk
```

## Verification Steps

### Check if APK is valid:
1. **File size:** Should be 20-50MB (not 0 bytes or very small)
2. **File extension:** Must be `.apk` (not `.zip` or `.bin`)
3. **File name:** Should end with `.apk`

### Check your device:
1. **Android version:** Settings → About → Android version (need 6.0+)
2. **Storage:** Settings → Storage (need at least 50MB free)
3. **Unknown sources:** Must be enabled (see Issue 1 above)

## Alternative: Use Google Play Store (If Available)

If you have access to Google Play Console:
1. Build with `--profile production`
2. Upload to Google Play Console
3. Distribute via internal testing track
4. Employees install from Play Store (easier, no unknown sources needed)

## Still Having Issues?

### Try these:
1. **Clear browser cache** and download again
2. **Use Chrome browser** on Android (most compatible)
3. **Check EAS build logs** - make sure build completed successfully
4. **Try building again** - sometimes builds can have issues

### Check Build Status:
- Go to https://expo.dev
- Check your build status
- Make sure it says "Finished" not "Failed"
- Re-download if build was successful

### Contact Support:
- Check EAS build logs for errors
- Verify the build completed successfully
- Try building again if needed

## Quick Checklist

Before installing:
- [ ] Android 6.0 or newer
- [ ] Unknown sources enabled
- [ ] At least 50MB storage free
- [ ] APK file downloaded completely
- [ ] File extension is `.apk`
- [ ] File size is reasonable (20-50MB)

Installation steps:
- [ ] Open file manager
- [ ] Navigate to Downloads
- [ ] Tap APK file
- [ ] Tap "Install"
- [ ] Wait for completion
- [ ] Tap "Open"

---

**Most common issue:** Unknown sources not enabled. Make sure to enable it in Settings!

