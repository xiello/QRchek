#!/bin/bash
# Direct build script - run this from the mobile directory

# Get absolute path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Current directory: $(pwd)"
echo "🔍 Verifying directory..."
ls -la package.json > /dev/null 2>&1 || {
    echo "❌ Error: package.json not found. Are you in the mobile directory?"
    exit 1
}

echo "✅ Directory verified"
echo "🚀 Starting EAS build..."
echo ""

# Run the build
eas build --platform android --profile preview

