# Environment Setup Guide

## Development Environment

### 1. Client Environment (`client/.env`)
Create `client/.env` with:
```bash
# Development environment
VITE_API_BASE_URL=http://localhost:5001/api
VITE_DYNAMIC_ENV_ID=your_dynamic_env_id_here
NODE_ENV=development
```

### 2. Server Environment (`server/.env`)
Create `server/.env` with:
```bash
# Development environment
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lucidledger_dev
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=5001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Production Environment

### 1. GitHub Secrets
Set these in your GitHub repository settings:
- `VITE_DYNAMIC_ENV_ID`: Your production Dynamic Labs environment ID
- `DB_HOST`: Production database host
- `DB_PORT`: Database port (usually 5432)
- `DB_NAME`: Production database name
- `DB_USER`: Production database user
- `DB_PASSWORD`: Production database password

### 2. Manual Production Setup (if not using GitHub Actions)
Create `client/.env` on production server:
```bash
VITE_API_BASE_URL=https://lucidledger.co/api
VITE_DYNAMIC_ENV_ID=your_production_dynamic_env_id
NODE_ENV=production
```

Create `server/.env` on production server:
```bash
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=lucidledger_prod
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password

PORT=5001
NODE_ENV=production

CORS_ORIGIN=https://lucidledger.co
```

## Running the Application

### Development
```bash
# Start backend
cd server
npm install
npm run dev

# Start frontend (in another terminal)
cd client
npm install
npm run dev
```

### Production (with Docker)
```bash
# Using nginx compose (recommended for production)
docker-compose -f docker-compose.nginx.yml up -d --build

# Or using regular production compose
docker-compose -f docker-compose.prod.yml up -d --build
```

## Dynamic Labs Environment ID

1. Go to [Dynamic Labs Dashboard](https://app.dynamic.xyz/)
2. Navigate to **Environments**
3. Copy your **Environment ID** (not API key)
4. Use this ID in your `VITE_DYNAMIC_ENV_ID` environment variable

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5001/api` | `https://lucidledger.co/api` | Frontend API endpoint |
| `VITE_DYNAMIC_ENV_ID` | Your dev env ID | Your prod env ID | Dynamic Labs environment ID |
| `NODE_ENV` | `development` | `production` | Node environment |
| `DB_HOST` | `localhost` | Production DB host | Database host |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://lucidledger.co` | Allowed CORS origins |
