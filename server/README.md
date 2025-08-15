# Lucid Ledger Server

A simple Express.js backend server for the Lucid Ledger application with MVC architecture and authentication functionality.

## Features

- **MVC Architecture**: Organized code structure with Models, Views (API responses), and Controllers
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with connection pooling
- **Validation**: Input validation using express-validator
- **Security**: CORS enabled, environment variable configuration
- **API Endpoints**: RESTful API design

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Jobs
- `GET /api/jobs` - Get all jobs (protected)
- `GET /api/jobs/:id` - Get job by ID (protected)
- `POST /api/jobs` - Create new job (protected, employer only)
- `PUT /api/jobs/:id` - Update job (protected, employer only)
- `DELETE /api/jobs/:id` - Delete job (protected, employer only)

### Contracts
- `GET /api/contracts` - Get all contracts (protected)
- `GET /api/contracts/:id` - Get contract by ID (protected)
- `POST /api/contracts` - Create new contract (protected)
- `PUT /api/contracts/:id` - Update contract (protected)

## Setup

1. Install dependencies: `npm install`
2. Create `.env` file with database configuration
3. Run migrations: `npm run migrate`
4. Start server: `npm start`

## Environment Variables

- `PORT` - Server port (default: 5001)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time