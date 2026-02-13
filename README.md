# Lucid Ledger

A decentralized job marketplace with blockchain-backed smart contracts, automated oracle verification, and gas-free USDC payments on Base.

## Features

- **Job Marketplace** — Employers post jobs, workers browse and apply, with full application lifecycle management
- **Smart Contract Payments** — USDC escrow via on-chain `ManualWorkContract` deployed through a `WorkContractFactory`
- **Oracle Verification** — Multiple verification methods (Manual, Time Clock, Image, Weight, GPS) to confirm work completion before payment release
- **Gas-Free Transactions** — Account abstraction with Coinbase Smart Wallets and sponsored UserOps (users never need ETH)
- **Dispute Resolution** — On-chain dispute filing with mediator assignment and resolution tracking
- **Admin Dashboard** — Employer approval workflow, mediator management, and contract factory deployment
- **Dual-Role System** — Users can be both employer and worker with the same account; self-dealing prevented on-chain and in backend

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS v4
- React Router v6
- [Privy](https://privy.io) for authentication (`@privy-io/react-auth`)
- [viem](https://viem.sh) + [permissionless](https://docs.pimlico.io/permissionless) for blockchain interactions
- [ethers.js](https://docs.ethers.org/v6/) v6 for contract ABI encoding
- Recharts for analytics

### Backend
- Node.js + Express
- PostgreSQL (AWS RDS) with Sequelize ORM
- Privy server-side JWT verification (`@privy-io/server-auth`)
- Helmet, CORS, rate limiting

### Blockchain
- Solidity smart contracts (Foundry toolchain)
- Base Sepolia testnet (chain ID 84532)
- USDC payments (6 decimals)
- Coinbase Smart Wallet for account abstraction

### Infrastructure
- Docker Compose with Nginx reverse proxy
- GitHub Actions CI/CD deploying to EC2
- AWS RDS PostgreSQL
- Let's Encrypt SSL via Certbot

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd lucidledger
```

2. Create environment files (see [Environment Variables](#environment-variables) below):
```bash
# Create server/.env and client/.env with required variables
```

3. Install dependencies and start:
```bash
# Backend
cd server && npm install && npm run dev

# Frontend (separate terminal)
cd client && npm install && npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

### Using Docker

```bash
docker compose up --build
```

For production deployment with Nginx + SSL:
```bash
docker compose -f docker-compose.nginx.yml up -d --build
```

## Environment Variables

### Client (`client/.env`)
```bash
# Privy
VITE_PRIVY_APP_ID=your_privy_app_id

# API
VITE_API_BASE_URL=http://localhost:5001/api

# Blockchain
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://sepolia.basescan.org

# Contract Addresses
VITE_USDC_ADDRESS=0x...
VITE_FACTORY_ADDRESS=0x...

# Admin
VITE_ADMIN_EMAILS=admin@example.com

# Demo Mode (shows warning banners for testing)
VITE_DEMO_MODE=true
```

### Server (`server/.env`)
```bash
# Database (PostgreSQL / AWS RDS)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lucidledger_dev
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Privy JWT Verification
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PRIVY_JWKS_URL=https://auth.privy.io/api/v1/apps/YOUR_APP_ID/.well-known/jwks.json
PRIVY_ISSUER=privy.io

# Admin
ADMIN_EMAILS=admin@example.com

# Demo Mode
DEMO_MODE=true
```

## Project Structure

```
lucidledger/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Shared components (Navbar, Footer, ProtectedRoute)
│   │   ├── contracts/          # ABI files, AA client, contract interaction helpers
│   │   ├── EmployeePages/      # Worker pages (dashboard, job search, tracker, earnings)
│   │   ├── EmployerPages/      # Employer pages (dashboard, contract factory, disputes)
│   │   │   └── ContractFactory/ # Job posting, application review, contract deployment
│   │   ├── Form/               # Multi-step job creation wizard
│   │   ├── hooks/              # Custom hooks (useAuth, useIdleTimeout)
│   │   ├── pages/              # Shared pages (landing, about, profile, admin)
│   │   └── services/           # API client (apiService singleton)
│   ├── Dockerfile.prod
│   └── package.json
├── server/                     # Express backend
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route handlers (class-based, static methods)
│   ├── middleware/              # Auth middleware (verifyToken, verifyAdmin)
│   ├── migrations/             # SQL migration files (auto-run on startup)
│   ├── models/                 # Sequelize models
│   ├── routes/                 # Express route definitions
│   ├── scripts/                # DB reset, migration runner, contract sync
│   ├── Dockerfile.prod
│   └── package.json
├── contracts/                  # Solidity smart contracts (Foundry)
│   └── src/
│       ├── ManualWorkContract.sol
│       └── WorkContractFactory.sol
├── docs/                       # Documentation
├── notes/                      # Development notes and TODOs
├── docker-compose.yml          # Development Docker config
├── docker-compose.nginx.yml    # Production Docker config (Nginx + SSL)
├── nginx.conf                  # Nginx configuration
└── .github/workflows/deploy.yml # CI/CD pipeline
```

## API Endpoints

All routes are prefixed with `/api` and protected by Privy JWT authentication.

### Employees
- `POST /api/employees` — Create employee profile
- `GET /api/employees/email/:email` — Lookup by email
- `GET /api/employees/wallet/:address` — Lookup by wallet address
- `GET /api/employees/phone/:phone` — Lookup by phone

### Employers
- `POST /api/employers` — Create employer profile
- `GET /api/employers/email/:email` — Lookup by email
- `GET /api/employers/wallet/:address` — Lookup by wallet
- `PUT /api/employers/:id` — Update employer profile

### Job Postings
- `POST /api/job-postings` — Create job posting
- `GET /api/job-postings` — List job postings (with filters)
- `GET /api/job-postings/:id` — Get job details
- `PUT /api/job-postings/:id` — Update job posting
- `PUT /api/job-postings/:id/status` — Update job status

### Job Applications
- `POST /api/job-applications/apply` — Apply to job
- `POST /api/job-applications/save` — Save job for later
- `GET /api/job-applications/employee/:id` — Get employee's applications
- `GET /api/job-applications/job/:id` — Get applications for a job
- `PUT /api/job-applications/:id/status` — Update application status

### Deployed Contracts
- `POST /api/deployed-contracts` — Record deployed contract
- `GET /api/deployed-contracts/employer/:id` — Get employer's contracts
- `GET /api/deployed-contracts/employee/:walletAddress` — Get worker's contracts
- `PUT /api/deployed-contracts/:id` — Update contract state

### Mediators
- `POST /api/mediators` — Register mediator
- `GET /api/mediators` — List mediators

### Dispute History
- `POST /api/dispute-history` — Create dispute record
- `GET /api/dispute-history/contract/:address` — Get disputes for contract

### Admin
- `GET /api/admin/employers` — List all employers
- `GET /api/admin/employers/pending` — List employers pending approval
- `POST /api/admin/employers/:id/approve` — Approve employer
- `POST /api/admin/employers/:id/reject` — Reject employer

### Other
- `GET /api/contract-templates` — List contract templates
- `POST /api/oracle-verifications` — Record oracle verification
- `POST /api/payment-transactions` — Record payment transaction

## Smart Contract Architecture

### WorkContractFactory
Deploys individual `ManualWorkContract` instances for each employer-worker agreement. Tracks all deployed contracts and emits events for indexing.

### ManualWorkContract
USDC escrow contract between employer and worker:
1. **Employer funds** the contract with USDC
2. **Worker signs** and begins work
3. **Oracle verifies** work completion (or employer manually approves)
4. **Contract releases** USDC to worker
5. **Disputes** can be raised by either party, resolved by assigned mediator

Key safety checks:
- Worker cannot be the employer (`require(_worker != msg.sender)`)
- Payments in USDC (ERC-20) on Base, not native ETH
- Mediator resolution splits funds based on ruling

## Deployment

Production deployments are automated via GitHub Actions on push to `main`.

The pipeline:
1. SSHs into EC2 instance
2. Pulls latest code
3. Generates `.env` files from GitHub Secrets/Variables
4. Rebuilds Docker containers (`docker-compose -f docker-compose.nginx.yml up -d --build`)
5. Runs health checks against the live domain

Required GitHub configuration:
- **Secrets**: `SSH_PRIVATE_KEY`, `EC2_HOST`, `EC2_USER`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PRIVY_APP_SECRET`
- **Variables**: `VITE_PRIVY_APP_ID`, `VITE_DEMO_MODE`, `VITE_BASE_SEPOLIA_CHAIN_ID`, `VITE_BASE_SEPOLIA_RPC`, `VITE_BASESCAN_URL`, `VITE_USDC_ADDRESS`, `VITE_FACTORY_ADDRESS`, `VITE_ADMIN_EMAILS`, `ADMIN_EMAILS`, `DEMO_MODE`, `PRIVY_JWKS_URL`, `PRIVY_ISSUER`

Manual deploys can be triggered via `workflow_dispatch` with environment and branch selection.

## Support

For support, email admin@lucidledger.co or create an issue in this repository.
