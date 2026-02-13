# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Backend (server/)
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production mode
npm run migrate      # Run database migrations

# Frontend (client/)
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Docker
```bash
# Development
docker compose up --build                              # Build and start all services
docker compose logs -f [backend|frontend]              # View logs

# Production (automated via CI/CD, manual commands for reference)
docker compose -f docker-compose.nginx.yml up -d --build
```

### Database
```bash
# Migrations run automatically on server startup via server.js
# Manual migration (if needed):
cd server && npm run migrate

# Reset all data (dev/test only):
cd server && npm run db:reset
```

## Architecture Overview

### Dual-Role System
This is a job marketplace platform with **two user roles**:
- **Employees (Workers)**: Browse jobs, apply, track applications, sign contracts, receive USDC payments
- **Employers**: Create jobs, review applications, deploy smart contracts, manage workforce

**Users can have BOTH roles** with the same account (email/phone/wallet):
- Same Privy account can create both employee AND employer profiles
- Separate database records in `employee` and `employer` tables with same wallet address
- Self-dealing prevented by backend validation (cannot apply to own jobs)

**Additional roles**:
- **Mediators**: Resolve disputed contracts (DB-backed role, managed by admin)
- **Admins**: Approve employers, manage mediators, deploy factory contracts (email-based via `ADMIN_EMAILS` env var)

**Role Navigation**: Role is stored in `localStorage` as `userRole` or `pendingRole` and determines:
- Which landing page user is on (`/` for employees, `/employers` for employers)
- Which dashboard to redirect to after auth
- Which profile to check/create during onboarding
- User switches roles by visiting different landing pages

### Authentication Flow (Privy)

1. **Privy Integration** (`@privy-io/react-auth`)
   - Provider: `<PrivyProvider>` in `client/src/App.jsx`
   - Auth methods: Email, phone, or wallet connection
   - Smart wallets: `<SmartWalletsProvider>` from `@privy-io/react-auth/smart-wallets`
   - Embedded wallets created on login for users without wallets
   - Default chain: Base Sepolia

2. **Custom `useAuth` Hook** (`client/src/hooks/useAuth.js`)
   - Wraps Privy's `usePrivy`, `useWallets`, `useSmartWallets`, `useLinkAccount`, `useUpdateAccount`
   - Returns: `user`, `isAuthenticated`, `isLoading`, `login`, `logout`, `getAccessToken`, `primaryWallet`, `smartWalletClient`, `smartWalletAddress`, `linkEmail`, `linkPhone`, `updateEmail`, `updatePhone`
   - Accepts optional `linkCallbacks` and `updateCallbacks` params for account linking/updating
   - `logout()` clears app localStorage keys before calling Privy logout

3. **Backend Token Verification** (`server/middleware/authMiddleware.js`)
   - Verifies Privy JWT access tokens via JWKS endpoint (ES256/RS256)
   - Caches signing keys for 24 hours
   - Looks up user email from Privy DID via `@privy-io/server-auth` PrivyClient
   - Exports: `verifyToken`, `optionalAuth`, `verifyAdmin`
   - Admin verification checks user email against `ADMIN_EMAILS` env var

4. **Post-Auth Profile Check** (`AppContent` component in `App.jsx`)
   - Checks if user exists in database by: email → wallet address → phone number
   - New users → `/user-profile` for profile creation
   - Existing users → role-specific dashboard

### Database Architecture (PostgreSQL + Sequelize)

**Connection**: AWS RDS with SSL (`server/config/database.js`)

**Core Models** (`server/models/`):
- `Employee` - Worker profile (name, email, phone, wallet_address, skills, work_experience)
- `Employer` - Company profile (employee fields + company_name, description, industry, size, approval_status)
- `JobPosting` - Job listings with oracle config (positions_available, positions_filled, selected_oracles)
- `JobApplication` - Links employees to jobs (application_status, offer_accepted_at)
- `SavedJob` - Employee's saved jobs (removed when application is submitted)
- `ContractTemplate` - Reusable contract templates for employers
- `DeployedContract` - On-chain contract records (contract_address, status, payment_amount, mediator_id)
- `OracleVerification` - Oracle verification records
- `PaymentTransaction` - Payment history (tx_hash, amount, currency, from/to addresses)
- `Mediator` - Mediator accounts (name, email, wallet_address, status)
- `DisputeHistory` - Dispute resolution records

**Migration System**:
- SQL files in `server/migrations/` (001 through 014)
- Auto-run on server startup (`server.js` `runMigrationsOnStartup()`)
- Idempotent — tables created with `IF NOT EXISTS`

### Frontend Architecture

**Component Organization**:
- `src/EmployeePages/` - Worker pages (EmployeeJobsPage, JobTracker, EmployeeProfile, SupportCenter)
- `src/EmployerPages/` - Employer pages (ContractFactory, WorkforceDashboard, Dispute, EmployerProfile)
- `src/EmployerPages/ContractFactory/` - Tabbed recruitment hub (PostedJobsTab, ApplicationReviewTab, AwaitingDeploymentTab, JobCreationWizard, ContractLibrary)
- `src/pages/` - Shared pages (LandingPage, EmployerLandingPage, UserProfile, MediatorResolution, Admin*)
- `src/components/` - Shared components (Navbar, Footer, ProtectedRoute, BetaBanner, IdleTimeoutWarning)
- `src/services/api.js` - Centralized API client (all backend calls)
- `src/contracts/` - Smart contract ABIs and interaction helpers

**Routing** (React Router v6 in `App.jsx`):
```
# Public
/                      → LandingPage (employee-facing)
/employers             → EmployerLandingPage
/about-us              → AboutPage

# Onboarding (protected)
/user-profile          → UserProfile (initial profile creation)

# Employee (protected, requiredRole="employee")
/job-search            → EmployeeJobsPage
/job-tracker           → JobTracker
/employee-profile      → EmployeeProfile
/support-center        → SupportCenter

# Employer (protected, requiredRole="employer")
/contract-factory      → ContractFactory (main employer hub)
/workforce             → WorkforceDashboard
/review-completed-contracts → ReviewCompletedContracts
/dispute               → Dispute
/employer-profile      → EmployerProfile
/employer-support      → EmployerSupportCenter

# Mediator (self-validates via DB)
/resolve-disputes      → MediatorResolution

# Admin (self-validates via ADMIN_EMAILS)
/admin                 → AdminDashboard
/admin/employers       → AdminEmployers (approve/reject employers)
/admin/mediators       → AdminMediators
/admin/deploy-factory  → AdminDeployFactory
```

**API Client Pattern** (`src/services/api.js`):
- Singleton class export: `import apiService from '../services/api'`
- Automatically includes Privy access token in Authorization header
- Sends `x-wallet-address` header for identity verification
- Base URL from `VITE_API_BASE_URL` env var

### Backend Architecture (Express + MVC)

**Pattern**: Class-based controllers with static methods
- Controllers: `server/controllers/` (employeeController, employerController, jobPostingController, deployedContractController, mediatorController, etc.)
- Routes: `server/routes/` (mount controllers, apply verifyToken middleware)
- All routes prefixed with `/api` and protected by auth middleware

**API Route Prefixes** (from `server.js`):
```
/api/employees              → employeeRoutes
/api/employers              → employerRoutes
/api/job-applications       → jobApplicationRoutes
/api/contract-templates     → contractTemplateRoutes
/api/job-postings           → jobPostingRoutes
/api/deployed-contracts     → deployedContractRoutes
/api/oracle-verifications   → oracleVerificationRoutes
/api/payment-transactions   → paymentTransactionRoutes
/api/mediators              → mediatorRoutes
/api/dispute-history        → disputeHistoryRoutes
/api/admin/employers        → adminEmployerRoutes
```

**Security Stack**:
- Helmet (security headers)
- Rate limiting: 100 requests per 15 min per IP (production only)
- CORS: Configured via `CORS_ORIGIN` env var
- Body size limit: 10mb
- Privy JWT verification via JWKS
- Admin email verification via Privy server SDK
- Self-dealing prevention: wallet address comparison blocks applying to own jobs

### Blockchain Integration

**Smart Contracts**:
1. **ManualWorkContract** - Individual work contracts between employer and worker
   - Deployed per-contract via factory or direct deployment
   - Holds USDC escrow, supports dispute resolution via mediator
   - States: funded → completed/disputed/refunded

2. **WorkContractFactory** - Factory pattern for deploying ManualWorkContracts
   - Address configured via `VITE_FACTORY_ADDRESS`
   - Admin can deploy factory via `/admin/deploy-factory`

**Account Abstraction (Gas-Free Transactions)**:
- Smart wallets via Privy's SmartWalletsProvider (Coinbase Smart Wallet)
- All blockchain writes use sponsored transactions
- Users never need ETH — gas paid by platform
- Key file: `client/src/contracts/aaClient.js`

**Contract Interaction Files**:
- `client/src/contracts/aaClient.js` - AA client, sponsored transaction helpers, error parsing
- `client/src/contracts/deployWorkContract.js` - Direct contract deployment
- `client/src/contracts/deployViaFactory.js` - Factory-based deployment
- `client/src/contracts/workContractInteractions.js` - Contract state reads and writes
- `client/src/contracts/adminUtils.js` - Admin utilities (factory deployment, USDC operations)

**Payment**: USDC on Base Sepolia (6 decimals)

### Job Marketplace Flow

1. **Employer Creates Job** (`/contract-factory` → JobCreationWizard)
   - Multi-step wizard: basics → location → employment type → oracles → responsibilities → review
   - Submitted with status `draft`

2. **Job Activation** (PostedJobsTab)
   - Employer activates drafts → status becomes `active`
   - Only `active` jobs visible to employees in job search

3. **Employee Job Search** (`/job-search`)
   - Two-column layout: job list + detail view
   - Filters: all, saved, applied, offers

4. **Application Flow**:
   - Save → `saved_jobs` record (can unsave)
   - Apply → `job_applications` record, removes from saved_jobs
   - Employer reviews → accepts/rejects application

5. **Contract Deployment** (AwaitingDeploymentTab):
   - Accepted applications appear for contract deployment
   - Employer deploys ManualWorkContract via factory with USDC escrow
   - Worker signs contract on-chain

6. **Job Status Transitions**:
   - `active` → stays active until all positions have deployed contracts
   - `in_progress` → all positions filled, contracts still running
   - `completed` → all contracts completed
   - `closed` → all contracts refunded/terminated

### Dispute Resolution

- Workers or employers can set contract status to `disputed`
- Admin assigns mediator to disputed contract (conflict-of-interest check enforced)
- Mediator can resolve (complete or terminate contract)
- Dispute history recorded in `dispute_history` table
- Frontend: Worker raises disputes from JobTracker, employer views in Dispute page
- Mediator resolves via `/resolve-disputes`

## Environment Configuration

### Server (`server/.env`)
```bash
# Database (AWS RDS PostgreSQL)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=lucidledger_dev
DB_USER=your_username
DB_PASSWORD=your_password

# Server
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Privy Authentication
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PRIVY_JWKS_URL=https://auth.privy.io/api/v1/apps/YOUR_APP_ID/.well-known/jwks.json
PRIVY_ISSUER=privy.io

# Admin
ADMIN_EMAILS=admin@example.com
ADMIN_WALLETS=0x...

# Demo Mode
DEMO_MODE=true
```

### Client (`client/.env`)
```bash
# API
VITE_API_BASE_URL=http://localhost:5001/api

# Privy
VITE_PRIVY_APP_ID=your_privy_app_id

# Blockchain (Base Sepolia)
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
VITE_FACTORY_ADDRESS=your_factory_address
VITE_BASESCAN_URL=https://base-sepolia.blockscout.com

# Demo Mode
VITE_DEMO_MODE=true
```

**Note**: `LIGHTNINGCSS_FORCE_WASM=1` is set in package.json scripts (required for Vite build).

### Demo Mode

**Frontend** (`VITE_DEMO_MODE=true`):
- Amber warning banner on authenticated pages
- Beta notice on landing page
- Info banner on job search about testing with multiple accounts

**Backend** (`DEMO_MODE=true`):
- General demo-related features
- Self-dealing always blocked regardless of demo mode

**Production**: Set both to `false`, remove noindex meta tag from `client/index.html`. See `docs/PRODUCTION_CHECKLIST.md`.

## Key Implementation Patterns

### Working with Authentication

**Getting current user**:
```javascript
import { useAuth } from '../hooks/useAuth';

const { user, isAuthenticated, primaryWallet, smartWalletClient, smartWalletAddress } = useAuth();

// User fields (Privy):
user?.email?.address     // Email
user?.phone?.number      // Phone
smartWalletAddress       // Smart wallet address (primary identifier)
```

**Account linking** (adding email/phone to existing account):
```javascript
const { linkEmail, linkPhone } = useAuth(
  { onSuccess: (user) => console.log('linked!'), onError: (err) => console.error(err) }
);
linkEmail();  // Opens Privy OTP modal
linkPhone();  // Opens Privy OTP modal
```

**Making authenticated API calls**:
```javascript
import apiService from '../services/api';
// Token + wallet address automatically included in headers
const response = await apiService.getEmployeeByEmail(email);
```

### Working with Smart Contracts

**Sponsored transaction pattern** (gas-free):
```javascript
import { sendSponsoredTransaction, TxSteps } from '../contracts/aaClient';

const result = await sendSponsoredTransaction({
  smartWalletClient,   // From useAuth()
  to: contractAddress,
  data: encodedFunctionData,
  onStatusChange: ({ step, message }) => {
    // TxSteps: PREPARING_USEROP → SIGNING_USEROP → CONFIRMING → SUCCESS
  }
});
```

### Adding New Features

**Employee feature**:
1. Create page in `src/EmployeePages/`
2. Add route in `App.jsx` wrapped in `<ProtectedRoute requiredRole="employee">`
3. Add to employee navigation in `EmployeeNavbar.jsx`
4. API calls through `apiService` singleton

**Employer feature**:
- Same pattern, pages go in `src/EmployerPages/`, `requiredRole="employer"`

## Important Notes

- **No tests yet**: `npm test` returns error in both client and server
- **Migrations auto-run**: Server runs all migrations on startup (idempotent)
- **Phone normalization**: Multiple formats tried for user lookup (with/without country code)
- **Role persistence**: User role stored in localStorage, not in database
- **Oracle selection**: Stored as comma-separated string in `selected_oracles` field
- **Smart Wallets**: Users have smart contract wallets via Privy, not EOAs
- **Gas-Free UX**: All gas paid by platform paymaster
- **Payment currency**: USDC on Base Sepolia (6 decimals)
- **Idle timeout**: 13 min idle + 2 min warning before auto-logout
- **Build warning**: Large chunk warning (~2.3MB main bundle) is expected

## Current Branch Context

Main branch: `main`

When creating PRs, target the `main` branch unless specified otherwise.
