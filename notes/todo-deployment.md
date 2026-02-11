# Deployment Process TODO

## Overview

The deployment pipeline uses GitHub Actions to SSH into EC2, pull the latest code, generate `.env` files from GitHub Secrets/Variables, and rebuild Docker containers. This replaces the old approach of manually maintaining `.env` files on EC2.

**Flow:**
```
Push to main (or manual trigger)
  → GitHub Actions runs deploy.yml
  → SSHs into EC2
  → git pull
  → Generates client/.env and server/.env from GitHub Secrets/Variables
  → docker-compose -f docker-compose.nginx.yml up -d --build
  → Vite reads client/.env at build time (baked into JS bundle)
  → Node reads server/.env at runtime
  → Health check verifies deployment
```

## Files Changed (Privy Migration)

- [x] `.github/workflows/deploy.yml` — Rewrote to generate .env files from GitHub Secrets/Variables
- [x] `client/Dockerfile.prod` — Removed stale VITE_DYNAMIC_ENV_ID ARG/ENV (Vite reads .env directly now)
- [x] `client/.dockerignore` — Changed `.env*` to `.env.local` / `.env.*.local` so .env passes into Docker build
- [x] `docker-compose.nginx.yml` — Removed stale build args and DEMO_MODE passthrough
- [x] `.github/workflows/ci.yml` — Fixed `VITE_API_URL` → `VITE_API_BASE_URL`

## Step 1: Add GitHub Secrets

Go to: GitHub repo → Settings → Secrets and variables → Actions → Secrets tab → "New repository secret"

| Secret Name | Description | Where to find value |
|---|---|---|
| `EC2_HOST` | Production EC2 IP or hostname | AWS EC2 console (may already exist) |
| `EC2_USER` | SSH user (`ubuntu` or `ec2-user`) | Depends on AMI (may already exist) |
| `SSH_PRIVATE_KEY` | SSH private key for EC2 | Your `.pem` file contents (may already exist) |
| `DB_HOST` | AWS RDS endpoint | AWS RDS console, e.g. `xxx.rds.amazonaws.com` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Production database name | e.g. `lucidledger_prod` |
| `DB_USER` | Production DB username | RDS master user or app-specific user |
| `DB_PASSWORD` | Production DB password | RDS credentials |
| `PRIVY_APP_SECRET` | Privy app secret for JWT verification | Privy dashboard → App Settings → App Secret |

### Optional (staging only — skip if no staging server)

| Secret Name | Description |
|---|---|
| `STAGING_HOST` | Staging EC2 IP or hostname |
| `STAGING_USER` | Staging SSH user |
| `STAGING_SSH_KEY` | Staging SSH private key |

## Step 2: Add GitHub Variables

Go to: GitHub repo → Settings → Secrets and variables → Actions → Variables tab → "New repository variable"

| Variable Name | Value | Notes |
|---|---|---|
| `VITE_PRIVY_APP_ID` | `cmkvjesdv01qbl50cqrv846nw` | Privy dashboard → App ID |
| `VITE_DEMO_MODE` | `true` | Set to `false` for production launch |
| `VITE_BASE_SEPOLIA_CHAIN_ID` | `84532` | Base Sepolia testnet |
| `VITE_BASE_SEPOLIA_RPC` | `https://sepolia.base.org` | Public RPC |
| `VITE_BASESCAN_URL` | `https://sepolia.basescan.org` | Block explorer |
| `VITE_USDC_ADDRESS` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle USDC on Base Sepolia |
| `VITE_FACTORY_ADDRESS` | `0x81BCDbF20479f0ED35180F03bA78Acad1B944Ee4` | Deployed WorkContractFactory |
| `VITE_ADMIN_EMAILS` | `admin@lucidledger.co,emmanuel.teitelbaum@gmail.com` | Comma-separated |
| `DEMO_MODE` | `true` | Server-side demo mode; `false` for launch |
| `ADMIN_EMAILS` | `admin@lucidledger.co,emmanuel.teitelbaum@gmail.com` | Server-side admin list |
| `PRIVY_JWKS_URL` | `https://auth.privy.io/api/v1/apps/cmkvjesdv01qbl50cqrv846nw/jwks.json` | For JWT verification |
| `PRIVY_ISSUER` | `privy.io` | Privy JWT issuer claim |

## Step 3: Merge to Main

```bash
git checkout main
git merge feature/privy-migration
git push origin main
```

Pushing to `main` automatically triggers the deploy workflow.

## Step 4: Verify Deployment

The deploy workflow will:
1. SSH into EC2
2. `git pull origin main`
3. Generate `client/.env` and `server/.env` from Secrets/Variables
4. Stop existing containers
5. Prune Docker (free memory on EC2)
6. `docker-compose -f docker-compose.nginx.yml up -d --build`
7. Wait 90 seconds for services to start
8. Health check: tries `https://lucidledger.co/api/health` up to 10 times
9. Report success or dump diagnostic logs on failure

Monitor progress at: GitHub repo → Actions tab → Deploy workflow run

## Step 5: Post-Deploy Verification

- [ ] Visit `https://lucidledger.co` — landing page loads
- [ ] Sign in with Privy (email or phone) — auth works
- [ ] Check employer dashboard — data loads from RDS
- [ ] Check worker dashboard — jobs display
- [ ] Test smart contract interaction — factory address resolves
- [ ] Check `/api/health` endpoint returns 200

## Manual Deploy (if needed)

To deploy a specific branch or to staging:
1. Go to GitHub repo → Actions → "Deploy" workflow
2. Click "Run workflow"
3. Select environment: `prod` or `staging`
4. Enter branch name
5. Click "Run workflow"

## Architecture Notes

### Why .env files are generated (not committed)
- `.env` files are in `.gitignore` — they never travel via git
- Production values (DB passwords, Privy secret) must not be in the repo
- `deploy.yml` generates them fresh on each deploy from GitHub Secrets/Variables
- Single source of truth: change a value in GitHub Settings, redeploy

### Why Dockerfile.prod has no build ARGs for VITE_*
- `client/.dockerignore` allows `.env` through (but blocks `.env.local`)
- Dockerfile's `COPY . .` includes the generated `.env`
- Vite automatically reads `.env` at build time
- No need to maintain the same variable list in 3 places

### What about contracts/.env?
- Only used locally for Hardhat/Foundry dev tooling
- Not needed in production — contracts are already deployed on-chain
- Frontend references deployed contracts via `VITE_FACTORY_ADDRESS` and `VITE_USDC_ADDRESS`

### Production launch checklist (when switching from demo)
- Set `VITE_DEMO_MODE` → `false` (GitHub Variable)
- Set `DEMO_MODE` → `false` (GitHub Variable)
- Remove `<meta name="robots" content="noindex, nofollow" />` from `client/index.html`
- Update contract addresses if deploying to Base mainnet
- Update `VITE_BASE_SEPOLIA_*` vars to Base mainnet equivalents
- Redeploy
