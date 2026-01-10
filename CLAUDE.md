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
docker-compose up --build                              # Build and start all services
docker-compose logs -f [backend|frontend]              # View logs

# Production (automated via CI/CD, manual commands for reference)
docker-compose -f docker-compose.nginx.yml up -d --build
```

### Database
```bash
# Migrations run automatically on server startup via server.js
# Manual migration (if needed):
cd server && npm run migrate
```

## Architecture Overview

### Dual-Role System
This is a job marketplace platform with **two distinct user roles**:
- **Employees**: Browse jobs, apply, track applications
- **Employers**: Create jobs, review applications, manage contracts

**Critical Pattern**: Role is stored in `localStorage` as `userRole` or `pendingRole` and determines:
- Which login view to show (Dynamic Labs)
- Which dashboard to redirect to after auth
- Which API endpoints to call (employee vs employer)

### Authentication Flow
1. **Dynamic Labs Integration** (NOT traditional JWT)
   - Provider: `<DynamicContextProvider>` in `client/src/App.jsx`
   - Auth methods: Email, phone, or wallet connection
   - Token: RS256 from Dynamic Labs (decoded, not verified with secret in dev)
   - Backend middleware: `server/middleware/authMiddleware.js` extracts token from `Authorization: Bearer <token>`

2. **Post-Auth Profile Check** (in `AppContent` component, `App.jsx:232-309`)
   - Checks if user exists in database by: email → wallet address → phone number
   - Multiple phone format attempts (with/without country code)
   - New users → `/user-profile` for profile creation
   - Existing users → role-specific dashboard

3. **User Profile Storage**
   - Database tables: `employee` or `employer` (separate models)
   - Both include: wallet_address, email, phone_number for multi-lookup support
   - Employer model adds: company_name, company_description, industry, company_size

### Database Architecture (PostgreSQL + Sequelize)

**Connection**: AWS RDS with SSL (`server/config/database.js`)

**Core Models**:
- `Employee` - Basic user info + wallet_address
- `Employer` - Employee fields + company details
- `Job` - Job postings with oracle configuration (selected_oracles field)
- `JobApplication` - Links employees to jobs with application_status
- `SavedJob` - Employee's saved jobs (not yet applied)

**Migration System**:
- SQL files in `server/migrations/`
- Auto-run on server startup (server.js:86-104)
- Key files:
  - `create-all-tables.sql` - Creates all tables with indexes
  - `add-employer-id-to-jobs.sql` - Adds FK relationship
  - `add-missing-fields.sql` - Schema updates

**Important Relationships**:
- Jobs belong to Employers (employer_id FK with CASCADE delete)
- JobApplications link employees to jobs (unique constraint on employee_id + job_id)
- SavedJobs removed when application is submitted

### Frontend Architecture

**Component Organization**:
- `src/EmployeePages/` - Employee-specific pages (dashboard, job search, tracker)
- `src/EmployerPages/` - Employer-specific pages (dashboard, create job, review apps, disputes)
- `src/Form/` - Multi-step job creation form (6 steps including oracle selection)
- `src/pages/` - Shared pages (Landing, About, UserProfile)
- `src/components/` - Shared components (Navbar, Footer, ProtectedRoute)
- `src/services/api.js` - Centralized API client (all backend calls go through this)
- `src/contracts/` - Smart contract ABIs and interaction helpers

**Routing Pattern** (React Router v6 in `App.jsx`):
- All authenticated routes wrapped in `<ProtectedRoute>`
- Role-specific dashboards: `/employee-dashboard` vs `/employerDashboard`
- Shared route: `/user-profile` for initial profile setup

**API Client Pattern** (`src/services/api.js`):
- Singleton class export: `import apiService from '../services/api'`
- Automatically includes Dynamic Labs token in headers via `getAuthToken()`
- Methods organized by entity: createEmployee, getAllJobs, applyToJob, etc.
- Base URL from `VITE_API_BASE_URL` env var

### Backend Architecture (Express + MVC)

**Pattern**: Class-based controllers with static methods
- Controllers: `server/controllers/` (EmployeeController, EmployerController, etc.)
- Routes: `server/routes/` (mount controllers, apply verifyToken middleware)
- All routes prefixed with `/api` and protected by auth middleware

**Security Stack**:
- Helmet (security headers)
- Rate limiting: 100 requests per 15 min per IP
- CORS: Configured via `CORS_ORIGIN` env var
- Body size limit: 10mb

**Key Endpoints**:
```
POST   /api/employees                    # Create employee
GET    /api/employees/email/:email       # Lookup by email
GET    /api/employees/wallet/:address    # Lookup by wallet
POST   /api/jobs                         # Create job (employer only)
GET    /api/jobs?employee_id=X           # Get jobs with employee context
POST   /api/job-applications/apply       # Apply to job
POST   /api/job-applications/save        # Save job
GET    /api/jobs/:id/applications        # Get job applications (employer only)
```

### Blockchain Integration

**Smart Contracts** (Deployed):
1. **GPSBasedPayment** (`client/src/contracts/GPSBasedPayment.json`)
   - Address: `0xE7B08F308BfBF36c752d1376C32914791ecA8514`
   - Function: `processPayment(address worker)` - Triggers payment if GPS verified
   - Prevents double payments via `paymentTriggered` mapping

2. **GPSOracle** (`client/src/contracts/GPSOracle.json`)
   - Address: `0xB420dDcE21dA14AF756e418984018c5cFAC62Ded`
   - Function: `isEligibleForPayment(address worker)` - Returns bool based on location
   - Emits: `LocationRecorded(address, lat, long, timestamp)`

**Contract Interaction** (`client/src/contracts/contractInteractions.js`):
```javascript
const { paymentContract, oracleContract } = await getBlockchainContracts();
const isEligible = await oracleContract.isEligibleForPayment(workerAddress);
if (isEligible) {
  await paymentContract.processPayment(workerAddress);
}
```

**Oracle System** (Job Verification Methods):
Employers select during job creation (`client/src/Form/Oracles.jsx`):
- GPS Oracle - Location-based verification
- Image Oracle - Photo evidence
- Weight Oracle - Quantity/weight measurement
- Time Clock Oracle - Automated time tracking
- Manual Verification - Supervisor approval

Selected oracles stored in `job.selected_oracles` as comma-separated string.

### Job Marketplace Flow

**Complete Lifecycle**:
1. **Employer Creates Job** (`/job` route)
   - 6-step form: basics → location type → employment type → **oracles** → responsibilities → review
   - Auto-fills company data from employer profile
   - Submitted with status 'draft'

2. **Job Activation** (`/view-open-contracts`)
   - Employer can edit or activate drafts
   - Status: draft → active (only active jobs visible to employees)

3. **Employee Job Search** (`/job-search`)
   - Two-column layout: job list + detail view
   - Shows saved/applied status per employee
   - Filters: all, saved, applied

4. **Application Actions**:
   - **Save**: Creates `saved_jobs` record (can unsave later)
   - **Apply**: Creates `job_applications` record, removes from saved_jobs
   - Application status: applied → accepted/rejected (by employer)

5. **Employer Reviews** (`/review-applications`)
   - View all applicants per job
   - Can update application status

6. **Contract States**:
   - Open: draft/active/paused jobs
   - Active: closed jobs ready for signing
   - Closed: archived contracts

### Dispute Resolution

**Current State** (`client/src/EmployerPages/Dispute.jsx`):
- UI exists with mock data
- Actions: Resolve or Escalate
- Search/filter functionality

**Expected Integration** (not yet implemented):
- Dispute table in database (not created yet)
- Link disputes to specific jobs/contracts
- Use oracle verification data as evidence (GPS, timestamps, images)
- Smart contract integration for automated resolution

## Environment Configuration

### Required Environment Variables

**Server** (`server/.env`):
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

# Security
CORS_ORIGIN=http://localhost:5173  # Frontend URL
```

**Client** (`client/.env`):
```bash
# API
VITE_API_BASE_URL=http://localhost:5001/api

# Dynamic Labs (get from https://app.dynamic.xyz/)
VITE_DYNAMIC_ENV_ID=your_dynamic_env_id
```

**Note**: LIGHTNINGCSS_FORCE_WASM=1 is set in package.json scripts (required for Vite build)

## Key Implementation Patterns

### Adding New Features

**When adding employee features**:
1. Check role in `localStorage.getItem('userRole')`
2. Use `useDynamicContext()` hook for user data
3. API calls through `apiService` singleton
4. Add route in `App.jsx` wrapped in `<ProtectedRoute>`
5. Add to employee navigation in `Navbar.jsx`

**When adding employer features**:
- Same pattern as above
- Employer-specific pages go in `src/EmployerPages/`
- Use employer-specific API endpoints (check employer_id)

### Working with Authentication

**Getting current user**:
```javascript
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
const { user, isAuthenticated, primaryWallet } = useDynamicContext();

// User fields:
user.email          // Email address
user.verifiedCredentials  // Array of verified methods
primaryWallet.address     // Wallet address
```

**Making authenticated API calls**:
```javascript
import apiService from '../services/api';
// Token automatically included in Authorization header
const response = await apiService.getEmployeeByEmail(email);
```

### Working with Database Models

**Lookup patterns** (multiple strategies for user lookup):
```javascript
// Try email first
let user = await Employee.findOne({ where: { email } });

// Fallback to wallet
if (!user && walletAddress) {
  user = await Employee.findOne({ where: { wallet_address: walletAddress } });
}

// Fallback to phone (with normalization)
if (!user && phoneNumber) {
  user = await Employee.findOne({ where: { phone_number: normalizedPhone } });
}
```

**Job queries** (with employee context):
```javascript
// Get all active jobs with saved/applied status for employee
const jobs = await Job.findAll({
  where: { status: 'active' },
  include: [
    { model: SavedJob, where: { employee_id: employeeId }, required: false },
    { model: JobApplication, where: { employee_id: employeeId }, required: false }
  ]
});
```

### Working with Smart Contracts

**Basic flow**:
1. Check MetaMask: `window.ethereum`
2. Get contracts: `await getBlockchainContracts()`
3. Interact with contracts (all async):
   ```javascript
   const tx = await paymentContract.processPayment(workerAddress);
   await tx.wait(); // Wait for confirmation
   ```

**GPS Location Capture** (`client/src/components/GetLocation.jsx`):
```javascript
import GetLocation from '../components/GetLocation';
const locationData = await GetLocation(); // { latitude, longitude, name }
```

## Important Notes

- **No tests yet**: `npm test` returns error in both client and server
- **Migrations auto-run**: Server runs migrations on startup (no manual step needed)
- **Phone normalization**: Multiple formats tried for lookup (with/without country code)
- **Role persistence**: User role stored in localStorage, not in database user table
- **Oracle selection**: Stored as comma-separated string, not array
- **Dynamic Labs RS256**: Tokens are decoded, not verified with secret (add JWKS verification for production)
- **Dispute system**: UI exists but not yet connected to backend/smart contracts
- **Payment amount**: Hardcoded to 100 wei in smart contract

## Current Branch Context

Branch: `ui-refactor`
Main branch: `main`

When creating PRs, target the `main` branch unless specified otherwise.