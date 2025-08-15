FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your Express app listens on
EXPOSE 5173

# Start the server with host binding for container access
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
