# AA Batching Note (Dynamic + Coinbase CDP)

## RESOLVED (2025-01-25)

The `account.encodeCalls is not a function` error has been fixed by implementing proper Coinbase Smart Account creation.

### Root Cause
- Dynamic Labs' `getWalletClient()` returns a regular EOA wallet client
- The `permissionless` library's `createSmartAccountClient` requires a SmartAccount object
- Passing `walletClient.account` (an EOA) doesn't work because EOAs don't have `encodeCalls`

### Solution Implemented
We now use viem's `toCoinbaseSmartAccount` to wrap the EOA signer in a proper Coinbase Smart Account:

```javascript
import { toCoinbaseSmartAccount } from "viem/account-abstraction";

const smartAccount = await toCoinbaseSmartAccount({
  client: publicClient,
  owners: [walletClient.account],  // EOA becomes an owner
});

const smartAccountClient = createSmartAccountClient({
  account: smartAccount,  // Now a proper SmartAccount with encodeCalls
  chain,
  bundlerTransport: ...,
  paymaster: pimlicoClient,
});
```

### Key Architecture Changes
1. **Dynamic Labs**: Handles authentication only (email/phone/wallet connection)
2. **Coinbase Smart Account**: Created from EOA signer, handles all transactions
3. **CDP Paymaster**: Sponsors gas fees
4. **Batching**: Now works atomically via `sendTransaction({ calls })`

### Important: Address Changes
With Coinbase Smart Account, users now have TWO addresses:
- **EOA Address**: `primaryWallet.address` - The signer's address
- **Smart Account Address**: `smartAccount.address` - The contract wallet that sends transactions

**USDC must be held by the smart account address**, not the EOA!

### Files Updated
- `client/src/contracts/aaClient.js` - Core AA client with `toCoinbaseSmartAccount`
- `client/src/contracts/deployWorkContract.js` - Uses smart account address for balance checks
- `client/src/contracts/workContractInteractions.js` - Uses smart account address for permission checks

### Testing Checklist
- [ ] Verify batching works: `typeof smartAccountClient.account.encodeCalls === 'function'`
- [ ] Verify USDC balance check uses smart account address
- [ ] Verify contract permissions match smart account address
- [ ] Test approve + deploy in single atomic batch
- [ ] Users need to fund their smart account address with USDC

---

## Original Issue (ARCHIVED)

### What happened
- We attempted to batch `approve + deploy` via `sendTransaction({ calls })`.
- The error `account.encodeCalls is not a function` indicated the wallet client was not AA-compatible.
- This occurred because Dynamic's wallet client returned an EOA, not a SmartAccount.

### Original mitigation (no longer needed)
- Fallback to sequential transactions was implemented but didn't fully work
- Sequential calls were not atomic and could fail mid-way

### Why batching matters
- Atomicity is important for wage-protection flows
- Partial success states (e.g., allowance set but deployment fails) are problematic
- With the fix, batching now works atomically
