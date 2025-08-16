FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 5173
# Start the server
CMD ["npm", "run" "dev"]

