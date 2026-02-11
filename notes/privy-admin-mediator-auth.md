# Privy Migration: Admin & Mediator Authentication

## Problem

After migrating from Dynamic Labs to Privy, admin and mediator role verification no longer works because:

1. **Dynamic Labs** included email directly in JWT token claims
2. **Privy** JWT tokens only contain:
   - `sub`: Privy DID (e.g., `did:privy:abc123`)
   - `iss`, `aud`, `iat`, `exp`: Standard JWT claims
   - **No email** in the token

The current `verifyAdmin` middleware in `server/middleware/authMiddleware.js` (lines 188-229) tries to extract email from:
```javascript
const userEmail =
  req.user?.email ||
  req.user?.user?.email ||
  req.user?.claims?.email ||
  req.user?.verified_email ||
  req.user?.verifiedEmail;
```

This returns `undefined` with Privy tokens, causing "Unable to determine user email from token" errors.

## Affected Features

- **Admin verification** (`verifyAdmin` middleware)
- **Mediator verification** (mediators table uses email for lookup)
- **Any other email-based authorization checks**

## Options

### Option 1: Use Wallet Addresses (Simplest)

Change admin and mediator verification to use wallet addresses instead of emails.

**Pros:**
- Consistent with the fix already made for user identity verification
- Wallet address is the user's on-chain identity anyway
- Frontend already sends `x-wallet-address` header

**Cons:**
- Wallet addresses are less human-readable than emails
- Need to update `ADMIN_EMAILS` env var to `ADMIN_WALLETS`
- Mediators table would need to use wallet_address as primary identifier

**Changes required:**
1. Update `verifyAdmin` middleware to read wallet from `x-wallet-address` header
2. Change `ADMIN_EMAILS` → `ADMIN_WALLETS` in environment config
3. Update mediator lookup to use wallet address
4. Update any admin UI to display/manage wallet addresses

### Option 2: Call Privy API from Backend

Use Privy's server-side API to fetch user details (including email) by their DID.

**Pros:**
- Can still use email-based authorization
- No database schema changes

**Cons:**
- Adds latency to every admin/mediator request
- Requires Privy API key configuration
- Additional API dependency

**Changes required:**
1. Add Privy API key to environment
2. Create helper function to fetch user by DID
3. Cache results to reduce API calls

### Option 3: Store Privy User ID in Database (Long-term Solution)

Store the Privy DID in the database and link it to user records. This is tracked in GitHub issue #31.

**Pros:**
- Proper long-term solution
- Can associate multiple identifiers (email, wallet, Privy ID) with same user
- Handles wallet address changes gracefully

**Cons:**
- Requires database schema changes
- More complex migration
- Need to handle existing users

**Changes required:**
1. Add `privy_user_id` column to employee/employer tables
2. Update onboarding flow to store Privy DID
3. Update user lookup logic to use Privy ID as primary key
4. Migration script for existing users

## Recommendation

**Short-term:** Implement Option 1 (wallet addresses) for consistency with existing fixes.

**Long-term:** Implement Option 3 (Privy user ID storage) as part of GitHub issue #31 to properly handle the identity model.

## Implementation Status (As of 2026-02-08)

**Implemented:**
1. Backend can look up Privy user email by DID in token verification.
2. `verifyAdmin` uses Privy API + `ADMIN_EMAILS` (email-based admin auth).
3. Some wallet-based admin gating exists in deployed contract controller using `ADMIN_WALLETS`.

**Not yet implemented (relative to Option 1):**
1. `verifyAdmin` still uses email; it does not read `x-wallet-address`.
2. `ADMIN_WALLETS` is not documented in env example; `ADMIN_EMAILS` remains the configured path.
3. Mediator auth/lookup still uses email (and token email extraction is Dynamic Labs style in mediator controller).
4. Frontend still references admin email-based validation in comments.

## Chicken-and-Egg Concern (Mediator Approval)

Wallet-based auth does **not** require a chicken-and-egg problem as long as mediator *approval* is based on a stable identifier that exists **before** wallet login (e.g., email), and wallet is attached **after** first login.

**Recommended flow (hybrid, no deadlock):**
1. Admin approves mediator **by email** (existing `mediators.email`).
2. Mediator logs in once and the system **attaches wallet_address** to that approved mediator record.
3. Ongoing mediator authorization can use **wallet_address** checks.

**If you want pure wallet-based approval (no email):**
- Admin must add mediator wallets out-of-band, or
- Mediator submits a “claim” request after first login; admin approves it from a pending list, or
- Require mediator to sign a message to prove wallet ownership before approval.

## Related

- GitHub Issue #31: Implement Privy user ID storage
- Earlier fix: `deployedContractController.js` updated to use wallet address fallback
- Frontend: `api.js` sends `x-wallet-address` header with all requests
