# Update Database Reset Script

**STATUS: RESOLVED** — Fixed in `fix/bugs-and-quick-wins` branch. Added all 12 tables to resetDb.js and updated docs/DATABASE_RESET.md.

## Problem
`server/scripts/resetDb.js` only truncates the original 5 tables:
- `job_applications`
- `saved_jobs`
- `jobs`
- `employee`
- `employer`

It does not include newer tables added by recent migrations:
- `mediators` (migration 010)
- `deployed_contracts` (migration 007)
- `oracle_verifications` (migration 008)
- `payment_transactions` (migration 009)
- `dispute_history` (migration 012)

## What to do
1. Update the `TRUNCATE TABLE` statement in `server/scripts/resetDb.js` to include all tables
2. Update the fallback `tables` array (line 46) to match
3. Respect foreign key ordering — tables with FK dependencies should be listed before the tables they reference
4. Update `docs/DATABASE_RESET.md` to list all tables under "What Gets Cleared"

## How to run after updating
```bash
# Local
cd server && npm run db:reset

# Production
ssh -i <pem-path> ubuntu@3.131.3.144 \
  "cd lucidledger && docker-compose -f docker-compose.nginx.yml exec -T backend npm run db:reset"
```
