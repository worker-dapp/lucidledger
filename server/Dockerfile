FROM node:20.18-alpine

WORKDIR /app

# Install build dependencies for native modules (required for native PostgreSQL bindings, etc.)
RUN apk add --no-cache python3 make g++

# Suppress npm update notices and set npm config in one layer
RUN npm config set update-notifier false

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with BuildKit cache mount (much faster on rebuilds)
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --prefer-offline

# Create non-root user before copying code (better caching)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy the rest of the application code
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["npm", "run", "dev"]
