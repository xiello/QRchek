# App Icon Setup Guide

## Quick Setup

Your app icon needs to be a **1024x1024 PNG** image. Here's how to create it:

### Option 1: Use Online Tools (Easiest)

1. **Go to Canva or Figma:**
   - Canva: https://www.canva.com/
   - Figma: https://www.figma.com/ (free)

2. **Create a 1024x1024 design:**
   - Create new design: 1024 x 1024 pixels
   - Add your QRchek logo (simple text mark works)
   - Use dark background (#1A1A1A) or transparent
   - Center the logo
   - Export as PNG

3. **Save the file:**
   - Name it: `icon.png`
   - Place it in: `mobile/assets/icon.png`

### Option 2: Use Image Editor

1. **Open your image editor** (Photoshop, GIMP, etc.)
2. **Create new image:** 1024x1024 pixels
3. **Add your QRchek logo:**
   - Use "QR" in blue (#3B82F6)
   - Use "chek" in white
   - Keep it simple; no swirls needed
4. **Background:** Dark (#1A1A1A) or transparent
5. **Export as PNG**

### Option 3: Generate from Logo Component

If you want to programmatically generate it, you can:
1. Use a tool like `react-native-view-shot` to capture the Logo component
2. Or create an SVG and convert to PNG

## Icon Requirements

- **Size:** 1024 x 1024 pixels
- **Format:** PNG
- **Background:** Transparent or solid color (#1A1A1A)
- **Content:** Your QRchek logo centered
- **Quality:** High resolution (no blur)

## File Location

Save your icon as:
```
mobile/assets/icon.png
```

## After Adding Icon

1. **Rebuild the app:**
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```

2. **The icon will automatically:**
   - Be resized for different Android sizes
   - Be used for iOS (if building iOS)
   - Appear on the home screen
   - Appear in app stores

## Design Tips

- **Keep it simple:** Icons are small, so details should be clear
- **High contrast:** Make sure logo is visible on dark background
- **No text:** Avoid small text (it won't be readable)
- **Centered:** Logo should be centered in the square
- **Padding:** Leave some space around edges (don't fill entire square)

## Current Logo Design

Your logo can be simple text:
- "QR" in blue (#3B82F6)
- "chek" in white
- No tagline required

For the icon, you can:
- Use just the text mark (no tagline)
- Keep it flat and simple (no swirls needed)
- Use dark background (#1A1A1A)

## Quick Test

After adding `icon.png`, you can test it locally:
```bash
cd mobile
npx expo start
```

Then press `i` for iOS simulator or `a` for Android emulator to see the icon.

