# Lucid Ledger

**Verifiable employment. Trusted contracts. Fair pay.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

[Live Site](https://lucidledger.co) | [White Paper](client/public/assets/luicid-ledger-whitepaper.pdf)

## Overview

Wage theft and labor exploitation persist across global supply chains because employment relationships lack transparency, verification, and enforcement. Workers face systematic underpayment, illegal deductions, and debt bondage, particularly in informal settings where traditional oversight fails. Voluntary compliance models have proven insufficient. Audits can be gamed, records falsified, and workers coached before inspections. The relationships between workers, intermediaries, and employers remain poorly documented and difficult to verify.

Lucid Ledger creates verifiable, enforceable work agreements that shift compliance upstream and alter the balance of power at the point of payment. Escrow-backed smart contracts secure wages upfront, so employers cannot unilaterally withhold earnings. Automated oracle verification provides objective, on-chain proof of work completion while structured dispute resolution with independent mediators ensures accountability when disagreements arise. The platform uses blockchain and smart contracts as the enforcement mechanism behind these guarantees.

The result serves two audiences equally. For workers, Lucid Ledger provides protection against exploitation in that wages are secured before work begins, and every agreement is documented on an immutable ledger. For employers, institutional stakeholders, and brands, it provides a due diligence and compliance infrastructure with verifiable audit trails, transparent labor practices, and enforceable standards across supply chains. Lucid Ledger creates natural incentives for all stakeholders to participate in more equitable labor arrangements by making previously invisible transactions transparent and enforceable.

For the full vision, read the [white paper](client/public/assets/luicid-ledger-whitepaper.pdf).

## How It Works

An employer creates a job posting through the **Contract Factory**, configuring payment terms, compliance rules, and verification methods tailored to the work: GPS tracking for location-based jobs, image verification for agricultural output, weight oracles for catches, time clocks for shift work, or manual approval for other arrangements.

Workers browse available positions through the **Job Search** interface, apply directly without intermediaries or broker fees, and undergo a screening process. When an employer accepts an application, a formal **Work Contract** is deployed on-chain. At this point, the employer's USDC payment is locked in escrow. The worker knows funds are secured before beginning work.

During the work period, the **Oracle Network** feeds objective verification of work performance on-chain. A GPS oracle might confirm a worker reached a job site; an image oracle might verify the volume of a harvest; a time clock oracle tracks hours worked. This verification is recorded immutably, creating an auditable trail that replaces the easily falsified paper records common in exploitative labor arrangements.

When oracles confirm work completion, **payment releases automatically** to the worker. If either party raises a dispute, the contract enters mediation. An independent mediator reviews the evidence and resolves the matter, with the ruling enforced on-chain. Every step is recorded, creating a transparent history that regulators, buyers, and certification bodies can audit.

## Key Features

- **Gas-free transactions**: Account abstraction with smart wallets means users never need ETH; all gas is sponsored by the platform
- **USDC payments on Base**: Stablecoin escrow on a low-cost L2, avoiding cryptocurrency volatility
- **Dual-role system**: The same account can operate as both employer and worker, with self-dealing prevention enforced on-chain and in the backend
- **Multiple oracle types**: GPS, image, weight, time clock, and manual verification methods adaptable to diverse work environments
- **Structured dispute resolution**: Independent mediator assignment with conflict-of-interest checks and on-chain enforcement
- **Admin dashboard**: Employer approval workflows, mediator management, and factory contract deployment

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

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd lucidledger
```

2. Create environment files. Copy the examples below and fill in your values. See [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md) for a full reference of all variables.

**`server/.env`**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lucidledger_dev
DB_USER=your_username
DB_PASSWORD=your_password
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PRIVY_JWKS_URL=https://auth.privy.io/api/v1/apps/YOUR_APP_ID/.well-known/jwks.json
PRIVY_ISSUER=privy.io
ADMIN_EMAILS=admin@example.com
DEMO_MODE=true
```

**`client/.env`**
```bash
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_API_BASE_URL=http://localhost:5001/api
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://sepolia.basescan.org
VITE_USDC_ADDRESS=0x...
VITE_FACTORY_ADDRESS=0x...
VITE_ADMIN_EMAILS=admin@example.com
VITE_DEMO_MODE=true
```

3. Install and run:
```bash
# Backend
cd server && npm install && npm run dev

# Frontend (separate terminal)
cd client && npm install && npm run dev
```

The app will be available at http://localhost:5173 (frontend) and http://localhost:5001 (API).

Database migrations run automatically on server startup.

### Using Docker

```bash
docker compose up --build
```

For production with Nginx + SSL:
```bash
docker compose -f docker-compose.nginx.yml up -d --build
```

## Project Structure

```
lucidledger/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── components/         # Shared components (Navbar, Footer, ProtectedRoute)
│       ├── contracts/          # ABI files, AA client, contract interaction helpers
│       ├── EmployeePages/      # Worker pages (job search, tracker, profile, support)
│       ├── EmployerPages/      # Employer pages (contract factory, workforce, disputes)
│       │   └── ContractFactory/ # Job posting, application review, contract deployment
│       ├── Form/               # Multi-step job creation wizard
│       ├── hooks/              # Custom hooks (useAuth, useIdleTimeout)
│       ├── pages/              # Shared pages (landing, about, profile, admin)
│       └── services/           # API client (apiService singleton)
├── server/                     # Express backend
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route handlers (class-based, static methods)
│   ├── middleware/              # Auth middleware (verifyToken, verifyAdmin)
│   ├── migrations/             # SQL migration files (auto-run on startup)
│   ├── models/                 # Sequelize models
│   ├── routes/                 # Express route definitions
│   └── scripts/                # DB reset, migration runner, contract sync
├── contracts/                  # Solidity smart contracts (Foundry)
│   └── src/
│       ├── ManualWorkContract.sol
│       └── WorkContractFactory.sol
├── docs/                       # Documentation
├── docker-compose.yml          # Development Docker config
├── docker-compose.nginx.yml    # Production Docker config (Nginx + SSL)
└── .github/workflows/deploy.yml # CI/CD pipeline
```

## API Reference

All routes are prefixed with `/api` and protected by Privy JWT authentication. See route files in `server/routes/` for full endpoint details.

| Resource | Description | Route Prefix |
|---|---|---|
| Employees | Worker profile CRUD and lookup | `/api/employees` |
| Employers | Employer profile CRUD and lookup | `/api/employers` |
| Job Postings | Create, list, update, and manage job status | `/api/job-postings` |
| Job Applications | Apply, save, and manage application status | `/api/job-applications` |
| Deployed Contracts | Record and query on-chain contracts | `/api/deployed-contracts` |
| Contract Templates | Reusable contract template library | `/api/contract-templates` |
| Oracle Verifications | Record oracle verification events | `/api/oracle-verifications` |
| Payment Transactions | Record payment history | `/api/payment-transactions` |
| Mediators | Mediator registration and listing | `/api/mediators` |
| Dispute History | Dispute records per contract | `/api/dispute-history` |
| Admin: Employers | Employer approval/rejection workflow | `/api/admin/employers` |

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
4. Rebuilds Docker containers (`docker compose -f docker-compose.nginx.yml up -d --build`)
5. Runs health checks against the live domain

Manual deploys can be triggered via `workflow_dispatch` with environment and branch selection.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please note that this project is licensed under AGPL-3.0. Any modifications, including those deployed as a network service, must be released under the same license.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE), the strongest copyleft license, ensuring all modifications (including those used over a network) remain open source.

Copyright (C) 2025 Lucid Ledger

## Support

For support, email admin@lucidledger.co or create an issue in this repository.
