#!/usr/bin/env bash
# scripts/render-build.sh

# Exit on error
set -o errexit

echo "📦 Installing dependencies..."
pnpm install

# Install Chrome with proper cache directory
echo "🌐 Installing Chrome for Puppeteer..."
echo "Cache directory: ${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}"

# Make sure the cache directory exists
mkdir -p "${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}"

# Install Chrome using puppeteer - this uses the PUPPETEER_CACHE_DIR env var
npx puppeteer browsers install chrome

# Verify Chrome was installed
CHROME_PATH="${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}/chrome"
if [ -d "$CHROME_PATH" ]; then
    echo "✅ Chrome installed successfully at: $CHROME_PATH"
    ls -la "$CHROME_PATH"
else
    echo "❌ Chrome installation failed - directory not found at: $CHROME_PATH"
    echo "Checking parent directory:"
    ls -la "${PUPPETEER_CACHE_DIR:-/opt/render/.cache/puppeteer}" || echo "Cache dir doesn't exist"
    exit 1
fi

echo "🔨 Building application..."
pnpm run build

echo "✅ Build successful!"