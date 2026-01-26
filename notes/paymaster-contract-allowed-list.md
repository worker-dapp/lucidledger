# Paymaster Allowlist Strategy (Smart Accounts + Dynamic)

## Context
- App uses **smart accounts** (ERC-4337) for users.
- Wallet connection / auth via **dynamic.xyz**.
- Gas sponsorship via **Coinbase CDP Paymaster** (Base / Base Sepolia).
- App deploys **per-user contracts** via a **factory**.

Key constraint: Paymaster allowlists operate on **call targets**. Per-user contracts have unpredictable addresses, so they cannot be practically allowlisted individually.

---

## Core Principle
**Do not allowlist per-user contract instances.**  
Instead, allowlist **one or two stable contracts** that gate all sponsored activity.

---

## Recommended Architecture (Best Practice)

### Contracts
1. **Factory**
   - Deploys per-user contracts.
   - Records deployed addresses in a registry.

2. **Registry** (optional but recommended)
   - Tracks valid contracts deployed by the factory.
   - Simple `isValid(address)` check.

3. **Router (LucidLedgerRouter)**
   - Single, stable address.
   - Smart accounts call this router in sponsored UserOps.
   - Router verifies:
     - target contract is in `Registry`
     - function selector is allowed
   - Router forwards the call.

### Paymaster Allowlist
- **Allowlist ONLY:**
  - `LucidLedgerRouter` address
  - (Optional) specific router function selectors (`execute`, `executeBatch`)
- **Optional (if sponsoring deployment):**
  - Factory address + deploy function selector

This keeps the paymaster surface area minimal and safe.

---

## When to Allowlist the Factory
Allowlist the **factory** only if:
- Deployment itself is gas-sponsored, AND
- The sponsored UserOperation directly calls `factory.deploy(...)`.

Otherwise, deployments can be user-paid and only post-deploy interactions are sponsored via the router.

---

## Why Not CREATE2 Alone?
- CREATE2 gives deterministic addresses, but:
  - brittle operationally
  - requires frequent allowlist updates
- Router + Registry scales better and is safer.

---

## Dynamic.xyz Note
- Dynamic handles auth and wallet UX.
- **Does not change Paymaster security requirements.**
- Paymaster trust must be **onchain + backend-enforced**, not frontend-based.

---

## Security Rules (Non-Negotiable)
- **Never expose the CDP Secret API key to the client.**
- All Paymaster calls go through a **backend you control**.
- Always use a contract allowlist on mainnet.

---

## MVP Setup (Base Sepolia)
- Enable Paym
