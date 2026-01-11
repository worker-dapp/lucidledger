# Docker Setup for Lucid Ledger

This guide explains how to run the Lucid Ledger application using Docker containers for local development. For production deployment, see [CI_CD_SETUP.md](./CI_CD_SETUP.md) which covers the automated CI/CD pipeline.

## Prerequisites

- Docker and Docker Compose installed
- AWS RDS PostgreSQL database configured (for production)
- Environment variables set up
- Domain configured: `https://lucidledger.co` (production only)

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

**Note:** Production deployments are automated via GitHub Actions CI/CD pipeline. See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for details.

Production uses `docker-compose.nginx.yml` which includes:
- Nginx reverse proxy with SSL/TLS
- Certbot for automatic SSL certificate management
- Frontend and backend services
- Automatic builds on EC2 during deployment

**Manual Production Setup (if needed):**

If you need to manually deploy to production:

1. **Set up environment variables on the server:**
   ```bash
   # On EC2 server, create server/.env
   DB_HOST=your-rds-endpoint.amazonaws.com
   DB_PORT=5432
   DB_NAME=lucidledger
   DB_USER=your-username
   DB_PASSWORD=your-password
   PORT=5001
   NODE_ENV=production
   CORS_ORIGIN=https://lucidledger.co
   ```

2. **Build and run production containers:**
   ```bash
   # Environment variables are set in the deployment script
   export VITE_API_BASE_URL="https://lucidledger.co/api"
   export VITE_DYNAMIC_ENV_ID="your-dynamic-env-id"
   export DOCKER_BUILDKIT=1
   export COMPOSE_DOCKER_CLI_BUILD=1
   docker-compose -f docker-compose.nginx.yml up -d --build
   ```

3. **Access the application:**
   - Frontend: https://lucidledger.co
   - Backend API: https://lucidledger.co/api (routed through nginx)
   - API Subdomain: https://api.lucidledger.co (alternative endpoint)

## Services

### Development Services (`docker-compose.yml`)
- **Frontend**: `lucidledger-client` - Port 5173
- **Backend**: `lucidledger-server` - Port 5001
- **Dockerfiles**: `client/Dockerfile` / `server/Dockerfile`

### Production Services (`docker-compose.nginx.yml`)
- **Frontend**: `lucidledger-frontend` - Served via nginx on port 80/443
- **Backend**: `lucidledger-backend` - Port 5001 (internal), exposed via nginx
- **Nginx**: `nginx-proxy` - Reverse proxy with SSL/TLS on ports 80/443
- **Certbot**: `certbot` - SSL certificate management
- **Dockerfiles**: `client/Dockerfile.prod` / `server/Dockerfile.prod`
- **Health Check**: Backend includes health check endpoint at `/api/health`

## Domain Configuration

### Production Domains
- **Frontend**: `https://lucidledger.co`
- **Backend API**: `https://lucidledger.co/api` (routed through nginx)
- **API Subdomain**: `https://api.lucidledger.co` (alternative endpoint)

### DNS Setup
Ensure your DNS is configured to point:
- `lucidledger.co` → EC2 server IP
- `api.lucidledger.co` → EC2 server IP (optional, same server)

### SSL Certificates
SSL certificates are automatically managed by Certbot via the CI/CD pipeline:
- Certificates are stored in `ssl/live/lucidledger.co/`
- Automatic renewal runs weekly via GitHub Actions workflow
- Both `lucidledger.co` and `api.lucidledger.co` use the same certificate

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

### Production Environment Variables

**Note:** In production, environment variables are set automatically by the CI/CD deployment script, not via `.env` files.

The deployment script sets:
- `VITE_API_BASE_URL=https://lucidledger.co/api`
- `VITE_DYNAMIC_ENV_ID` (from GitHub secrets)
- `NODE_ENV=production`

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

### Production (Manual - CI/CD is recommended)

**Note:** Production deployments are automated. These commands are for manual operations only.

```bash
# Build and start production services with nginx
docker-compose -f docker-compose.nginx.yml up -d --build

# View production logs
docker-compose -f docker-compose.nginx.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.nginx.yml logs -f nginx
docker-compose -f docker-compose.nginx.yml logs -f frontend
docker-compose -f docker-compose.nginx.yml logs -f backend

# Stop production services
docker-compose -f docker-compose.nginx.yml down

# Restart services
docker-compose -f docker-compose.nginx.yml restart

# Check service status
docker-compose -f docker-compose.nginx.yml ps
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

## Production Deployment Workflow

Production deployments are fully automated via GitHub Actions:

1. **Push to `main` branch** → Triggers automatic deployment
2. **GitHub Actions** → SSH to EC2 and runs deployment script
3. **EC2 Server** → Pulls latest code, builds Docker images, starts containers
4. **Health Checks** → Verifies deployment success

For details, see [CI_CD_SETUP.md](./CI_CD_SETUP.md).

## Performance Optimization

- Multi-stage builds for production
- Non-root user execution
- Optimized layer caching
- Health checks for reliability
- Proper restart policies
- Docker BuildKit enabled for faster builds
