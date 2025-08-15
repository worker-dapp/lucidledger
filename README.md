# Lucid Ledger

A decentralized job marketplace and payment system built with React, Node.js, and PostgreSQL.

## Features

- **Job Marketplace**: Post and find jobs with blockchain-based payments
- **GPS-based Payments**: Automated payment system using GPS verification
- **Smart Contracts**: Ethereum-based smart contracts for secure transactions
- **User Authentication**: Secure login and registration system
- **Dashboard**: Separate dashboards for employers and employees
- **Dispute Resolution**: Built-in dispute handling system

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios for API calls

### Backend
- Node.js
- Express.js
- PostgreSQL database
- JWT authentication

### Blockchain
- Ethereum smart contracts
- Web3.js for blockchain interactions

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd lucid-ledger
```

2. Create environment files:
```bash
# Create server/.env
cp server/ server/.env

# Create client/.env
cp client/ client/.env
```

3. Build and run with Docker:
```bash
docker compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- PostgreSQL: localhost:5432

### Manual Setup

1. Install dependencies:
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

2. Set up PostgreSQL database:
```bash
# Run the init.sql script in your PostgreSQL instance
```

3. Start the services:
```bash
# Backend
cd server
npm start

# Frontend (in a new terminal)
cd client
npm run dev
```

## Environment Variables

### Server (.env)
```
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lucid_ledger_db
DB_USER=lucid_user
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### Client (.env)
```
VITE_API_URL=http://localhost:5001
VITE_WEB3_PROVIDER=your_ethereum_provider_url
```

## Project Structure

```
lucid-ledger/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   └── contracts/     # Smart contract interactions
│   └── Dockerfile
├── server/                 # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── Dockerfile
├── docker-compose.yml     # Docker configuration
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job

### Contracts
- `GET /api/contracts` - Get user contracts
- `POST /api/contracts` - Create contract
- `PUT /api/contracts/:id` - Update contract status

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Support

For support, email admin@lucidledger.co or create an issue in this repository. 