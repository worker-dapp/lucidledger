# Docker Setup for Lucid Ledger

This guide explains how to run the Lucid Ledger application using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- AWS RDS PostgreSQL database configured
- Environment variables set up
- Domain configured: `https://lucidledger.co` (frontend) and `https://api.lucidledger.co` (backend)

## Quick Start

### Development Environment

1. **Set up environment variables:**
   ```bash
   # Copy environment templates
   cp server/env.example server/.env
   cp client/.env.example client/.env
   
   # Edit the files with your actual values
   nano server/.env
   nano client/.env
   ```

2. **Build and run all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - API Health Check: http://localhost:5001/api/health

### Production Environment

1. **Set up production environment variables:**
   ```bash
   # Copy and edit production environment files
   cp server/env.prod.example server/.env.prod
   cp client/env.prod.example client/.env.prod
   ```

2. **Build and run production containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Access the application:**
   - Frontend: https://lucidledger.co
   - Backend API: https://api.lucidledger.co

## Services

### Frontend (Client)
- **Container**: `lucidledger-client`
- **Port**: 5173 (dev) / 80 (prod)
- **Dockerfile**: `client/Dockerfile` / `client/Dockerfile.prod`
- **Environment**: `client/.env` / `client/.env.prod`

### Backend (Server)
- **Container**: `lucidledger-server`
- **Port**: 5001
- **Dockerfile**: `server/Dockerfile` / `server/Dockerfile.prod`
- **Environment**: `server/.env` / `server/.env.prod`
- **Health Check**: Built-in health check endpoint

## Domain Configuration

### Production Domains
- **Frontend**: `https://lucidledger.co`
- **Backend API**: `https://api.lucidledger.co`

### DNS Setup
Ensure your DNS is configured to point:
- `lucidledger.co` → Frontend server
- `api.lucidledger.co` → Backend server

### SSL Certificates
Make sure SSL certificates are configured for both domains:
- `lucidledger.co` (frontend)
- `api.lucidledger.co` (backend)

## Environment Variables

### Backend (.env)
```env
# Database Configuration
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=lucidledger
DB_USER=your-username
DB_PASSWORD=your-password

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=https://lucidledger.co
```

### Frontend (.env)
```env
# Dynamic Labs Configuration
VITE_DYNAMIC_ENV_ID=your-dynamic-env-id

# API Configuration
VITE_API_BASE_URL=http://localhost:5001/api
```

### Frontend (.env.prod)
```env
# Dynamic Labs Configuration
VITE_DYNAMIC_ENV_ID=your-dynamic-env-id

# API Configuration
VITE_API_BASE_URL=https://api.lucidledger.co/api

# Environment
NODE_ENV=production
```

## Docker Commands

### Development
```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up --build frontend
docker-compose up --build backend
```

### Production
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up --build -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

### Individual Service Management
```bash
# Start only backend
docker-compose up backend

# Start only frontend
docker-compose up frontend

# Scale services
docker-compose up --scale backend=2
```

## Health Checks

The backend service includes health checks:
- **Endpoint**: `/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 40 seconds

## Database Migration

Before running the application, ensure your database is set up:

```bash
# Run migrations (outside Docker)
cd server
npm run migrate
```

Or run migrations inside the container:
```bash
docker-compose exec backend npm run migrate
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Ensure ports 5173 and 5001 are available
   - Change ports in docker-compose.yml if needed

2. **Database connection issues:**
   - Verify AWS RDS credentials in `.env` file
   - Ensure RDS instance allows connections from your IP

3. **CORS errors:**
   - Update `CORS_ORIGIN` in backend `.env` file
   - Ensure frontend URL matches CORS configuration

4. **Container won't start:**
   - Check logs: `docker-compose logs backend`
   - Verify environment variables are set correctly

### Useful Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs backend
docker-compose logs frontend

# Execute commands in running container
docker-compose exec backend sh
docker-compose exec frontend sh

# Remove all containers and volumes
docker-compose down -v

# Clean up Docker system
docker system prune -a
```

## Security Notes

- Both Dockerfiles run as non-root users
- Production builds exclude development dependencies
- Health checks ensure service availability
- Rate limiting is configured on the backend
- CORS is properly configured

## Performance Optimization

- Multi-stage builds for production
- Non-root user execution
- Optimized layer caching
- Health checks for reliability
- Proper restart policies
