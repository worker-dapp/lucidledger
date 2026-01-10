FROM node:20.18-alpine

WORKDIR /app

# Install build dependencies for native modules (required for bufferutil, etc.)
RUN apk add --no-cache python3 make g++

# Suppress npm update notices
RUN npm config set update-notifier false

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with BuildKit cache mount (much faster on rebuilds)
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --prefer-offline

# Copy the rest of the application code
COPY . .

EXPOSE 5173

# Start the server
CMD ["npm", "run", "dev"]

