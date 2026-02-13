# Update Main README.md

## Problem
The root `README.md` is outdated and inaccurate. It still references Dynamic Labs, JWT auth, wrong env vars, incorrect API endpoints, and a stale project structure.

## What's wrong
- **Auth**: Says "JWT authentication" — should be Privy
- **Blockchain**: Says "Web3.js" — should be viem/wagmi
- **Smart contracts**: Only mentions GPS oracle — missing WorkContractFactory, ManualWorkContract, USDC payments
- **Env vars**: Lists `JWT_SECRET`, `VITE_WEB3_PROVIDER` — completely wrong
- **API endpoints**: Lists `/api/auth/register`, `/api/auth/login` — these don't exist
- **Project structure**: Missing `contracts/`, `notes/`, many new directories under `src/`
- **Dynamic + Coinbase note** at bottom: No longer relevant (migrated to Privy)
- **Features list**: Incomplete — missing admin system, mediator management, employer approval, contract factory

## Sections to rewrite
1. **Features** — Add contract factory, admin dashboard, mediator system, employer approval, USDC payments on Base
2. **Tech Stack** — Update: Privy auth, viem/wagmi, Base Sepolia, Solidity smart contracts
3. **Environment Variables** — List current Privy vars, DB vars, blockchain vars
4. **Project Structure** — Reflect actual directory layout including contracts/, notes/, new page directories
5. **API Endpoints** — Update to match actual routes (employees, employers, jobs, job-applications, mediators, admin, deployed-contracts, etc.)
6. **Quick Start** — Fix the `cp` commands, verify Docker instructions work
7. **Remove** the "Dynamic + Coinbase Smart Wallet Note" section
8. **Add** section about the deployment setup (GitHub Actions, EC2, RDS)
9. **Add** section about smart contract architecture (Factory pattern, ManualWorkContract, USDC escrow)

## Priority
Medium — important for onboarding new contributors but not blocking development.
