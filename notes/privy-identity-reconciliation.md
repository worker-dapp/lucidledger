# Privy Identity Reconciliation: Diagnosis & Plan

## Problem

Employee contracts don't appear on the Job Tracker page (local dev environment). The error is "You do not have permission to access these contracts" (403).

## Diagnosis

### Root Cause: Local DB Out of Sync with Shared Privy Account

The developer uses the **same Privy account** (phone 301-356-6272) across both production and local dev, but the two environments have **separate PostgreSQL databases**. The email was updated from `manny.teitelbaum@gmail.com` to `worker.lucidledger@gmail.com` via the production app, which updated Privy globally but only synced to the production DB. The local DB still has the old association.

**This is a dev/test workflow issue, not a platform bug.**

### Current State

**Privy account** (shared, User ID: `cmkx5tg4300gsl80cr8efzae6`):
- Phone: (301) 356-6272
- Email: `worker.lucidledger@gmail.com` (updated in production)
- Embedded wallet (EOA): `0x3AfED1c283A175542F79366808B052476c70010C`
- Smart wallet: `0x7F836c60FDd02A7487e32AF2555132F886428e3A`

**Local database — Employee table:**
| id | email | wallet_address |
|----|-------|---------------|
| 1 | `manny.teitelbaum@gmail.com` | `0x7F836c...8e3A` (correct smart wallet) |
| 2 | `worker.lucidledger@gmail.com` | `0x3A880199...1205` (stale — from a different/deleted Privy account) |

### Why the Local JobTracker Breaks

1. **Frontend** (JobTracker.jsx:54): Looks up employee by Privy email (`worker.lucidledger@gmail.com`) → finds employee **id=2**
2. **Frontend** calls `getDeployedContractsByEmployee(2)` with `x-wallet-address: 0x7F836c...` header
3. **Backend** (deployedContractController.js:272): Looks up employee by wallet `0x7F836c...` → finds employee **id=1**
4. **Backend** (line 280): Compares URL param id=2 vs wallet owner id=1 → mismatch → **403**

The frontend finds one employee by email, the backend finds a different one by wallet. These should be the same record but aren't because the local DB is stale.

### Why the Local Sync Didn't Fix It

The EmployeeProfile page has a sync mechanism (lines 180-196) that detects when Privy email differs from DB and calls `saveToAPI()`. However:

1. `fetchUserDetails()` looks up by wallet `0x7F836c...` → finds employee id=1 (`manny.teitelbaum@gmail.com`)
2. Sync detects mismatch: Privy says `worker.lucidledger@gmail.com`, DB says `manny.teitelbaum@gmail.com`
3. Tries to update employee id=1's email to `worker.lucidledger@gmail.com`
4. **Fails silently** — employee id=2 already has that email (unique constraint)
5. Error logged to console but not surfaced to user

### To Fix Local Data

Either reset the local DB (`npm run db:reset`) or manually fix the records:
- Delete orphaned employee id=2 (or update its email to something else)
- Update employee id=1's email to `worker.lucidledger@gmail.com`

---

## Real Bugs Exposed (Worth Fixing)

Even though the root cause was a dev workflow issue, the investigation exposed several real bugs that could affect production users:

### Bug 1: Silent Sync Failure

**Location:** `EmployeeProfile.jsx` lines 180-196, `saveToAPI()` line 227

When the Privy→DB email sync fails (e.g., unique constraint violation), the error is caught and logged to console but the user sees no feedback. The profile page continues showing stale DB data with a misleading "Verified" badge.

**Fix:** Surface sync errors to the user, or at minimum show a warning when the displayed email doesn't match the Privy-verified email.

### Bug 2: "Verified" Badge Shows on Wrong Email

**Location:** `EmployeeProfile.jsx` lines 498-506

The non-edit view displays `{email}` (DB value) with a "Verified" badge based on `{privyEmail}` being truthy. These can be different values. The badge should either:
- Be placed next to `privyEmail` instead of `email`, or
- Only show when `email === privyEmail`

### Bug 3: Case-Sensitive Wallet Lookups

**Location:** `employeeController.js:104`, `employerController.js` (getByWallet methods)

Wallet address lookups use exact match. Ethereum addresses can differ in checksum casing. The `deployedContractController` helper functions were already fixed to use `Op.iLike`, but the main controller endpoints haven't been.

**Fix:** Use `Op.iLike` for all wallet address queries, or normalize to lowercase on storage and lookup.

### Bug 4: No Unique Constraint on `wallet_address`

**Location:** `Employee` and `Employer` models

`wallet_address` has no unique constraint, allowing multiple records with the same wallet. This enables the split-identity state that caused this issue.

**Fix:** After cleaning up duplicates, add unique constraint. Consider making it case-insensitive (store lowercase).

### Bug 5: Profile Sync Only Runs on Profile Page

**Location:** `EmployeeProfile.jsx` / `EmployerProfile.jsx`

The Privy→DB sync only fires when the user visits their profile page. If they log in and go straight to JobTracker, their data is never reconciled.

**Fix:** Move the sync to `App.jsx` post-auth flow so it runs on every login, before any profile lookups.

---

## Privy Account Scoping: No Cross-App Risk

Privy accounts, wallets, and DIDs are **app-scoped by default**:
- A user on LucidLedger has completely separate wallets/IDs from the same user on another Privy-powered app
- Email/phone updates on another app do NOT affect LucidLedger
- Cross-app wallet sharing exists but is opt-in ("Global Wallets" feature), not enabled here

**This means the drift scenario cannot happen in production.** The only way email/wallet changes on a user's LucidLedger Privy account is through our own app's UI (or the Privy dashboard). In production there's one database, so the existing sync mechanism in EmployeeProfile.jsx would work — unless there are orphan duplicate records, which the unique email constraint should prevent during normal onboarding.

---

## Recommendation: Leave Well Enough Alone (For Now)

The investigation started as a production bug but turned out to be a dev environment data issue (shared Privy account, separate local DB). Given that Privy accounts are app-scoped, the scary cross-app drift scenario isn't real.

### Already Done
- **`Op.iLike` for wallet lookups in `deployedContractController.js`** — The `getEmployeeForUser` and `getEmployerForUser` helper functions now use `Op.iLike` (Sequelize's case-insensitive LIKE operator for PostgreSQL) instead of exact match for wallet address lookups. This prevents mismatches caused by Ethereum address checksumming (e.g., `0xAbCd...` vs `0xabcd...`). The change is harmless and good defensive practice even though it wasn't the root cause.

### Do Now
- **Fix local data** — update the local DB employee records to match the current Privy state so local testing can continue

### Do Later (Nice-to-Have, Low Priority — GitHub Issues)

1. **Silent sync failure (EmployeeProfile.jsx:227, EmployerProfile.jsx):** When the Privy→DB email/phone sync fails (e.g., unique constraint violation), the error is swallowed. Add user-visible feedback or at minimum a console warning that explains what happened.

2. **"Verified" badge mismatch (EmployeeProfile.jsx:498-506):** The non-edit view displays `{email}` (DB value) with a "Verified" badge based on `{privyEmail}` being truthy. These can be different values. Either display `privyEmail` when available, or only show the badge when `email === privyEmail`.

3. **Case-sensitive wallet lookups in other controllers:** `employeeController.getEmployeeByWallet` (line 104) and the equivalent in `employerController` still use exact match. Should use `Op.iLike` for consistency with the fix already applied in `deployedContractController`.

4. **No unique constraint on `wallet_address`:** Neither `Employee` nor `Employer` models enforce uniqueness on `wallet_address`. After confirming no duplicates exist in production, add a unique constraint to prevent future split-identity issues. Consider storing lowercase to simplify comparisons.

5. **Profile sync only runs on profile page:** The Privy→DB sync `useEffect` only fires when the user visits EmployeeProfile/EmployerProfile. If a user changes their email and navigates directly to JobTracker, their data won't be reconciled. Consider moving the sync to `App.jsx` post-auth flow.

### Don't Do (Unless Problems Arise in Production)
- **Privy User ID as stable key:** Significant architectural change (migration, new column, new lookup logic, backfill). Not justified given that Privy accounts are app-scoped and the existing email+wallet identity model works for production. Revisit only if real users report identity drift issues.
