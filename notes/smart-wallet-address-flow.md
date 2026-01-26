# Smart Wallet Address Flow: EOA → Coinbase Smart Account

## Overview

This document explains how the smart wallet address is derived from the EOA (Externally Owned Account) provided by Dynamic Labs, and why it's deterministic (same every time).

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER LOGS IN VIA DYNAMIC LABS                                │
│    - Email/Phone/Wallet connection                              │
│    - Dynamic creates or retrieves EOA                          │
│    - EOA Address: 0x1234...abcd (user's private key)           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GET WALLET CLIENT FROM DYNAMIC                               │
│    primaryWallet.getWalletClient()                               │
│    → Returns viem WalletClient with EOA account                 │
│    → walletClient.account = { address: "0x1234...abcd", ... }   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CREATE COINBASE SMART ACCOUNT                                │
│    toCoinbaseSmartAccount({                                      │
│      client: publicClient,                                      │
│      owners: [walletClient.account]  ← EOA becomes owner        │
│    })                                                            │
│                                                                  │
│    INTERNALLY, viem calculates:                                 │
│    - Uses Coinbase Smart Wallet factory contract                │
│    - Deterministic address via CREATE2                          │
│    - Formula: keccak256(                                        │
│        factory_address,                                          │
│        salt (derived from owner address),                        │
│        bytecode_hash                                             │
│      )                                                           │
│                                                                  │
│    → Smart Account Address: 0x5678...efgh (deterministic!)     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. SMART ACCOUNT OBJECT                                          │
│    {                                                             │
│      address: "0x5678...efgh",  ← Contract wallet address     │
│      encodeCalls: function() {...},  ← Enables batching         │
│      signUserOperation: function() {...},                        │
│      ...                                                         │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CREATE SMART ACCOUNT CLIENT                                  │
│    createSmartAccountClient({                                    │
│      account: smartAccount,  ← The SmartAccount object          │
│      chain: baseSepolia,                                        │
│      bundlerTransport: ...,                                      │
│      paymaster: pimlicoClient  ← CDP paymaster                  │
│    })                                                            │
│                                                                  │
│    → Ready to send UserOperations!                               │
└─────────────────────────────────────────────────────────────────┘
```

## Key Code Locations

### Step 1-2: Getting EOA from Dynamic
```javascript
// client/src/contracts/aaClient.js:128-142
const getWalletClient = async (primaryWallet) => {
  const walletClient = await primaryWallet.getWalletClient();
  // Returns: { account: { address: "0x1234...abcd", ... } }
  return walletClient;
};
```

### Step 3: Creating Smart Account
```javascript
// client/src/contracts/aaClient.js:176-185
const createCoinbaseSmartAccount = async (walletClient) => {
  const smartAccount = await toCoinbaseSmartAccount({
    client: publicClient,
    owners: [walletClient.account],  // EOA address
  });
  // Returns: { address: "0x5678...efgh", encodeCalls: ..., ... }
  return smartAccount;
};
```

### Step 4-5: Using Smart Account
```javascript
// client/src/contracts/aaClient.js:199-222
export const getSmartAccountClient = async (primaryWallet) => {
  const walletClient = await getWalletClient(primaryWallet);
  const smartAccount = await createCoinbaseSmartAccount(walletClient);
  
  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,  // Uses smartAccount.address internally
    ...
  });
  
  return smartAccountClient;
};
```

## Determinism: Why Same Address Every Time?

**YES, the smart wallet address is the SAME every time the user logs in.**

### Why?

1. **Same EOA Owner**: Dynamic Labs returns the same EOA address for the same user
   - Same email/phone → Same EOA private key → Same EOA address

2. **Deterministic Calculation**: `toCoinbaseSmartAccount` uses CREATE2
   - Input: EOA address (always the same for same user)
   - Factory contract address (constant on Base Sepolia)
   - Salt (derived from owner address)
   - Bytecode hash (constant for Coinbase Smart Wallet v1)

3. **Formula**:
   ```
   smartAccountAddress = CREATE2(
     factoryAddress,
     salt = keccak256(ownerAddress, version),
     bytecodeHash
   )
   ```

### Example

```
User logs in with email: alice@example.com
  ↓
Dynamic returns EOA: 0x1234...abcd (always the same)
  ↓
toCoinbaseSmartAccount calculates:
  - Owner: 0x1234...abcd
  - Factory: 0x... (Coinbase factory on Base Sepolia)
  - Salt: keccak256(0x1234...abcd, version)
  - Result: 0x5678...efgh (ALWAYS the same!)
```

**Every time Alice logs in:**
- EOA: `0x1234...abcd` ✅ (same)
- Smart Account: `0x5678...efgh` ✅ (same)

## Important Implications

### ✅ What This Means

1. **Persistent Address**: Users can fund their smart account once, and it persists across sessions
2. **Predictable**: You can calculate the address before the user even logs in (if you know their EOA)
3. **No Deployment Needed**: The smart account contract may not exist on-chain yet, but the address is already determined

### ⚠️ Important Notes

1. **First Transaction**: The smart account contract is deployed on-chain during the first transaction
   - Before first tx: Address exists but contract doesn't (counterfactual)
   - After first tx: Contract deployed, address is active

2. **USDC Must Be in Smart Account**: 
   - Users must send USDC to `0x5678...efgh` (smart account)
   - NOT to `0x1234...abcd` (EOA)
   - The smart account is what sends transactions

3. **One-to-One Mapping**:
   - One EOA → One Smart Account
   - Same EOA → Same Smart Account (always)

## Testing Determinism

You can verify this yourself:

```javascript
// First login
const address1 = await getSmartWalletAddress(primaryWallet);
console.log('First login:', address1);

// Log out and log back in
// ...

// Second login (same user)
const address2 = await getSmartWalletAddress(primaryWallet);
console.log('Second login:', address2);

// Should be identical!
console.log('Same address?', address1 === address2); // true
```

## References

- [Coinbase Smart Wallet Docs](https://docs.cdp.coinbase.com/embedded-wallets/smart-accounts)
- [Viem toCoinbaseSmartAccount](https://viem.sh/account-abstraction/accounts/smart/toCoinbaseSmartAccount)
- [EIP-4337 Account Abstraction](https://eips.ethereum.org/EIP-4337)
