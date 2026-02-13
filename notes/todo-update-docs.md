# Update Documentation for Current Setup

## Problem
Docs and config files still reference the old Dynamic Labs auth system and may have other outdated information after the Privy migration, contract factory additions, and deployment updates.

## Files to review and update

### Root config files
- **CLAUDE.md** — Still references Dynamic Labs in many places (auth flow, hooks, code examples). Needs full rewrite of auth sections for Privy. Also missing info on: contract factory, mediator system, admin pages, dispute history.
- **AGENTS.md** — Review for accuracy with current architecture.

### docs/
- **DATABASE_RESET.md** — Missing newer tables (mediators, deployed_contracts, dispute_history, etc.). See `notes/todo-update-db-reset-script.md`.
- **CI_CD_SETUP.md** — Verify matches current deploy.yml and CI workflow.
- **DOCKER_SETUP.md** — Check if instructions match current docker-compose.nginx.yml setup.
- **ENVIRONMENT_SETUP.md** — Update env vars list for Privy (remove Dynamic Labs vars, add PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_JWKS_URL, PRIVY_ISSUER). Add GitHub Secrets/Variables list.
- **PRODUCTION_CHECKLIST.md** — Update for Privy migration, verify deployment steps are current.
- **NGINX_SETUP.md** — Verify still accurate.
- **SMART_CONTRACT_SECURITY.md** — Update for ManualWorkContract and WorkContractFactory.
- **DEPLOYING_FACTORY.md** — Verify accuracy.
- **CONTRIBUTORS.md** / **GOVERNANCE.md** — Low priority, review if time permits.

## Key changes to reflect
1. **Auth**: Dynamic Labs → Privy (`@privy-io/react-auth`, `usePrivy`, `useLinkAccount`, `useUpdateAccount`)
2. **Smart wallets**: Via `@privy-io/react-auth/smart-wallets` (not ZeroDev)
3. **Contract system**: WorkContractFactory pattern, deployed_contracts table
4. **Admin system**: Admin dashboard, employer approval, mediator management
5. **Dispute resolution**: dispute_history table and resolution flow
6. **Deployment**: GitHub Secrets/Variables setup, deploy.yml workflow
7. **Environment variables**: New Privy vars, removed Dynamic Labs vars

## Approach
Go through each file, compare against current codebase, and update. CLAUDE.md is highest priority since it guides AI tooling.
