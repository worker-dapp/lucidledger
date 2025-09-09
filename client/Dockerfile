FROM node:20.18-alpine as build

WORKDIR /app

# Suppress npm update notices
RUN npm config set update-notifier false

# Copy package files
COPY package*.json ./

# Install dependencies (tolerate lockfile drift inside container)
RUN npm install --no-audit --no-fund && npm cache clean --force

# Copy the rest of the application code
COPY . .

EXPOSE 5173

# Start the server
CMD ["npm", "run", "dev"]

