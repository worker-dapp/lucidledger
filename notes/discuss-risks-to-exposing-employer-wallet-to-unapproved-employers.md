# Security Hardening: Employer Approval Gating

## Context

Currently, unapproved employers can see and interact with the Privy wallet widget after logging in. While the upstream job creation flow is blocked (both frontend and backend return 403 for unapproved employers), the wallet itself and sponsored transaction infrastructure have no approval checks.

**Current risk level: LOW** — the attack surface is effectively mitigated by upstream blocking, and all funds/gas are testnet (Base Sepolia). However, these improvements should be in place before going live on mainnet.

---

## Improvement 1: Add approval check to `deployedContractController`

### Problem
`server/controllers/deployedContractController.js` does not check `approval_status` before creating deployed contract records. If an unapproved employer somehow bypasses the job creation gate (e.g., direct API call with a fabricated job_posting_id), they could create contract records.

### Implementation Plan
1. In `deployedContractController.js`, at the start of the `create` method:
   - Look up the employer by the authenticated user's ID or wallet address
   - Check `employer.approval_status === 'approved'`
   - Return 403 if not approved
2. Also add the same check to any update/status-change endpoints in that controller
3. Consider creating a reusable middleware: `requireApprovedEmployer` that can be applied to any employer-action route

### Files to modify
- `server/controllers/deployedContractController.js`
- `server/middleware/authMiddleware.js` (if creating reusable middleware)
- `server/routes/deployedContractRoutes.js` (to apply middleware)

### Effort: Small (1-2 hours)

---

## Improvement 2: Gate paymaster sponsorship by approval status

### Problem
The Coinbase CDP paymaster (configured via Privy's SmartWalletsProvider) sponsors gas for ALL authenticated users regardless of employer approval status. On testnet this costs nothing (Sepolia ETH is free), but on mainnet this would mean real ETH/gas costs for every sponsored transaction.

A bad actor could:
- Create an employer account (auto-gets smart wallet)
- Never get approved
- Craft transactions via browser console using `smartWalletClient.sendTransaction()`
- Each transaction burns paymaster credits (real money on mainnet)

### Implementation Plan

**Option A: Backend transaction proxy (recommended)**
1. Instead of letting the frontend call the paymaster directly, route sponsored transactions through a backend endpoint
2. Backend verifies: user is authenticated AND (is employee OR is approved employer)
3. Only then does the backend relay the transaction with paymaster sponsorship
4. This gives full server-side control over who gets sponsorship

**Option B: Privy webhook / policy rules**
1. Configure paymaster policies in the Privy dashboard or Coinbase CDP dashboard
2. Use allowlists or rules to restrict which wallet addresses get sponsorship
3. Update the allowlist when an employer is approved/rejected
4. Simpler but less flexible

**Option C: Frontend guard (weakest)**
1. Check `approval_status` before calling `sendSponsoredTransaction()` in the frontend
2. Easy to implement but trivially bypassable via browser console
3. Only useful as a UX guard, not a security measure

### Recommendation
Option A for mainnet launch. Option C is fine as an interim measure for testnet.

### Files to modify
- `client/src/contracts/aaClient.js` (Option C: add approval check)
- `server/routes/` + `server/controllers/` (Option A: new proxy endpoint)
- Privy/CDP dashboard (Option B)

### Effort: Medium (Option C: 1 hour, Option A: 4-6 hours)

---

## Improvement 3: Audit all employer API endpoints for missing approval checks

### Problem
Currently, only `jobPostingController.js` checks `approval_status` (in two places: create at line 66-72, activate at line 296-300). All other employer endpoints are unprotected:

- `deployedContractController.js` — no check (covered in Improvement 1)
- `employerController.js` — no check (profile updates, likely fine)
- `jobApplicationController.js` — no check (employer reviewing applications)
- Any future endpoints added without awareness of this pattern

### Implementation Plan
1. **Audit each endpoint** and categorize:
   - **Must gate**: Any action that creates obligations, deploys contracts, or spends funds
   - **Should gate**: Actions like reviewing applications, managing job postings
   - **No gate needed**: Profile viewing/editing (employer needs to complete profile to get approved)

2. **Create `requireApprovedEmployer` middleware**:
   ```javascript
   // server/middleware/authMiddleware.js
   const requireApprovedEmployer = async (req, res, next) => {
     const employer = await Employer.findOne({
       where: { /* match by authenticated user */ }
     });
     if (!employer || employer.approval_status !== 'approved') {
       return res.status(403).json({
         success: false,
         message: 'Employer account not approved',
         approval_status: employer?.approval_status || 'unknown'
       });
     }
     req.employer = employer;
     next();
   };
   ```

3. **Apply middleware to routes** instead of checking in each controller:
   ```javascript
   // server/routes/jobPostingRoutes.js
   router.post('/', verifyToken, requireApprovedEmployer, JobPostingController.create);
   ```

4. **Remove inline checks** from `jobPostingController.js` once middleware is in place

### Files to modify
- `server/middleware/authMiddleware.js` (add middleware)
- `server/routes/jobPostingRoutes.js`
- `server/routes/deployedContractRoutes.js`
- `server/routes/jobApplicationRoutes.js` (employer-side endpoints)
- `server/controllers/jobPostingController.js` (remove inline checks)

### Effort: Medium (3-4 hours)

---

## Priority Order

| # | Improvement | Priority | When |
|---|------------|----------|------|
| 3 | Reusable approval middleware + audit | HIGH | Before next feature sprint |
| 1 | Gate deployedContractController | HIGH | Immediate (quick win) |
| 2 | Gate paymaster sponsorship | MEDIUM | Before mainnet launch |

Improvement 3 subsumes Improvement 1 (the middleware would cover the deployed contract controller), so doing #3 first is the most efficient path. However, #1 is a quick standalone fix if time is limited.

---

## Testnet vs Mainnet Risk Summary

| Risk | Testnet (now) | Mainnet (future) |
|------|--------------|-------------------|
| Gas sponsorship abuse | None (Sepolia ETH is free) | Real cost per tx |
| Unauthorized contract deployment | Low (upstream blocked) | Must be fully gated |
| Funds received into wallet | Testnet tokens only (worthless) | Real assets possible |
| Wallet visibility | No risk | No risk (wallet is user's own) |
