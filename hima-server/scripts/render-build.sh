#!/usr/bin/env bash
# scripts/render-build.sh

# Exit on error
set -o errexit

echo "Installing dependencies..."
pnpm install

# Install Chrome
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

echo "Building..."
pnpm run build

echo "Build successful!"