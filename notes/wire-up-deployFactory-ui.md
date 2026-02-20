# Wire Up deployFactory() to Admin UI

## Context
`client/src/contracts/adminUtils.js` has a `deployFactory()` function that deploys a new WorkContractFactory via sponsored transaction from the admin smart wallet. This function is **not wired to any UI button** — the admin page (`AdminDeployFactory.jsx`) only shows CLI instructions.

## Why It Matters
Currently factory deployment requires:
1. A MetaMask EOA with testnet ETH and a private key in `contracts/.env`
2. Running `npx hardhat run scripts/deployFactory.js --network baseSepolia` from terminal
3. The deployer (EOA) is different from the admin (smart wallet), which means admin-only calls like `registerOracle()` can't happen in the same script

If `deployFactory()` were wired to a button:
- Admin could deploy directly from the browser with one click
- Smart wallet would be both deployer and admin — no EOA/admin mismatch
- No need for MetaMask, private keys, or terminal commands
- `registerOracle()` could be called immediately after in the same session

## What to Build
- Add a "Deploy Factory" button to `AdminDeployFactory.jsx` that calls `deployFactory()` from `adminUtils.js`
- Show deployed address in the UI after success
- Optionally chain `registerOracle()` calls immediately after deployment
- Keep the CLI instructions as a fallback/reference

## Priority
Low — factory deployment happens rarely (once per major contract version). The terminal approach works fine for now.
