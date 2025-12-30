#!/bin/bash

# AMC Tvoj Coffeeshop - Mobile App Build Script

echo "🚀 Building AMC Tvoj Coffeeshop Mobile App"
echo ""

# Get the absolute path to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="${SCRIPT_DIR}/mobile"

# Check if mobile directory exists
if [ ! -d "$MOBILE_DIR" ]; then
    echo "❌ Error: mobile directory not found at $MOBILE_DIR"
    exit 1
fi

# Change to mobile directory using absolute path
cd "$MOBILE_DIR" || {
    echo "❌ Error: Failed to change to mobile directory"
    exit 1
}

echo "📁 Working directory: $(pwd)"
echo ""

echo "📱 Select build type:"
echo "1) Preview APK (for testing)"
echo "2) Production APK (for distribution)"
echo "3) iOS Build (requires Apple Developer account)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔨 Building Preview APK..."
        eas build --platform android --profile preview
        ;;
    2)
        echo "🔨 Building Production APK..."
        eas build --platform android --profile production
        ;;
    3)
        echo "🔨 Building iOS App..."
        eas build --platform ios --profile production
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Build complete! Check EAS dashboard for download link."
echo "📱 Share the download link with employees to install the app."

