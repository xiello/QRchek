#!/bin/bash

# AMC Tvoj Coffeeshop - Mobile App Build Script

echo "🚀 Building AMC Tvoj Coffeeshop Mobile App"
echo ""

# Check if we're in the right directory
if [ ! -d "mobile" ]; then
    echo "❌ Error: mobile directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

cd mobile

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

