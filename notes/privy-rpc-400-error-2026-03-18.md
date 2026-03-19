# Privy RPC 400 Error — "gas required exceeds allowance (0)"

**Date**: 2026-03-18
**Status**: Unresolved — needs Privy dashboard investigation

---

## Symptom

When the employer deploys a contract, Coinbase's Smart Wallet confirmation modal shows:

> Execution reverted with reason: gas required exceeds allowance (0)

This appears at "Step 1 of 2" (USDC approve simulation). The transaction still succeeds on-chain — Blockscout confirms the USDC transfer completes. The error is cosmetically alarming but functionally harmless so far.

---

## What We Ruled Out

- **Our code changes**: The recent commit (`d53306e`) did not touch `aaClient.js`, `deployViaFactory.js`, or any blockchain transaction path. Confirmed via `git show`.
- **Privy SDK version**: Locked at 3.12.0 by `package-lock.json` — no Privy update shipped with the recent deploy. Updated locally to 3.17.0 to test; error persists.
- **Coinbase CDP paymaster limits**: Dashboard shows 129 UserOperations / $1.65 gas spend on Base Sepolia this month — nowhere near the 1,000 op / $100 limit.
- **Student wallet activity**: Students only sign contracts (single call). The employer wallet is separate. Student load doesn't consume employer quota.
- **Browser extensions**: Error occurs on wife's phone (no MetaMask, no extensions) and on production. Extension interference ruled out.
- **nginx CSP headers**: Neither `nginx.conf` nor `client/nginx.conf` sets any `Content-Security-Policy` header.
- **Env var override**: `VITE_BASE_SEPOLIA_RPC` is pulled from GitHub Variables at deploy time. Even if wrong, it only affects `publicClient` (receipt reads), not the SmartWalletsProvider's RPC routing.

---

## Root Cause (Working Diagnosis)

The browser console shows three 400 errors from Privy's RPC gateway:

```
base-sepolia.rpc.privy.systems/?privyAppId=cmkvjesdv01qbl50cqrv846nw
Failed to load resource: the server responded with a status of 400
```

`SmartWalletsProvider` (Privy's smart wallet wrapper) routes ALL smart wallet RPC calls — including gas simulation — through `base-sepolia.rpc.privy.systems`, regardless of our `VITE_BASE_SEPOLIA_RPC` env var. This proxy authenticates by Privy App ID.

**The 400s mean Privy's RPC proxy is rejecting calls for this app.** When gas simulation calls fail, the Coinbase Smart Wallet modal reports the simulation as reverted with gas = 0, producing the error message. The actual transaction still goes through because on-chain execution uses a different path.

This was NOT happening before the class session (Mar 17). No code changes on our side can explain it. **Something changed in Privy's backend or dashboard configuration** for this app around that time.

---

## Suggested Next Steps

### 1. Check Privy Dashboard (highest priority)
Go to [dashboard.privy.io](https://dashboard.privy.io) and check:
- **Networks / Chains** — is Base Sepolia still enabled? Any warnings or required actions shown?
- **Smart Wallets** — any new required configuration for bundler/paymaster?
- **Any new banners or alerts** that require action on the app

### 2. Check GitHub Variable for RPC URL
Go to GitHub repo → Settings → Variables → `VITE_BASE_SEPOLIA_RPC`
Confirm it is set to `https://sepolia.base.org`. If blank or wrong, fix it (though this is not the cause of the modal error — see above).

### 3. Try Configuring SmartWalletsProvider with Custom RPC
If Privy dashboard looks fine, try bypassing Privy's RPC proxy in `client/src/App.jsx`:

```jsx
<SmartWalletsProvider config={{ rpcConfig: { [baseSepolia.id]: import.meta.env.VITE_BASE_SEPOLIA_RPC } }}>
```

This may or may not be respected depending on Privy's version — worth testing.

### 4. Contact Privy Support
If the dashboard looks correct, open a support ticket with Privy. Include:
- App ID: `cmkvjesdv01qbl50cqrv846nw`
- Network: Base Sepolia (Base Testnet)
- Error: 400 from `base-sepolia.rpc.privy.systems`
- Timeline: started around 2026-03-17, no code changes on our side

---

## Low-Priority Fallback

If the error proves impossible to eliminate and transactions always succeed despite it, add a dismissible info note in the deployment UI (`AwaitingDeploymentTab`) warning employers that the Privy simulation may show a false warning that can be safely ignored.
