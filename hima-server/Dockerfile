# Use the official Puppeteer image which includes Chromium
FROM ghcr.io/puppeteer/puppeteer:24.0.0

# Set working directory
WORKDIR /usr/src/app

# Switch to root to install dependencies if needed (Puppeteer image runs as 'pptruser' by default)
USER root

# Enable corepack for pnpm
RUN npm install -g corepack && corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Fix permissions for the pptruser
RUN chown -R pptruser:pptruser /usr/src/app

# Switch back to non-root user for security
USER pptruser

# Expose the port
EXPOSE 10000

# Environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# The image sets PUPPETEER_EXECUTABLE_PATH automatically, or acts as good default

CMD ["node", "dist/app.js"]
