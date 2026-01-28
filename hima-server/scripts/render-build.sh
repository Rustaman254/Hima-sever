#!/usr/bin/env bash
# scripts/render-build.sh

# Exit on error
set -o errexit

echo "Installing dependencies..."
pnpm install

# Install Chrome
# We use puppeteer to install the browser. 
# The cache directory is set via PUPPETEER_CACHE_DIR env var in render.yaml
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

echo "Building..."
pnpm run build

echo "Build successful!"
