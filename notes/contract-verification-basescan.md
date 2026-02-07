# Contract Verification on BaseScan

## Problem

Deployed contracts (ManualWorkContract, WorkContractFactory) show only bytecode on BaseScan. Without verification, you can't use the "Read Contract" and "Write Contract" buttons to inspect state or call functions directly.

## Why This Happens

When a contract is deployed, only the compiled bytecode goes on-chain. BaseScan doesn't know the original Solidity source code, so it can't decode function names or provide a UI for interaction.

## How to Verify

### Option 1: Hardhat Verify Plugin

1. Add BaseScan API key to environment:
   ```bash
   # In contracts/.env
   BASESCAN_API_KEY=your_api_key_here
   ```

2. Update `hardhat.config.js` to include etherscan config:
   ```javascript
   etherscan: {
     apiKey: {
       baseSepolia: process.env.BASESCAN_API_KEY
     },
     customChains: [
       {
         network: "baseSepolia",
         chainId: 84532,
         urls: {
           apiURL: "https://api-sepolia.basescan.org/api",
           browserURL: "https://sepolia.basescan.org"
         }
       }
     ]
   }
   ```

3. Run verification:
   ```bash
   cd contracts
   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <constructor_arg1> <constructor_arg2> ...
   ```

   For ManualWorkContract, constructor args are:
   - employer address
   - worker address
   - mediator address
   - payment token (USDC) address
   - payment amount
   - job ID
   - admin address

   For WorkContractFactory:
   - USDC address
   - admin address

### Option 2: BaseScan Web UI

1. Go to the contract page on BaseScan
2. Click "Contract" tab → "Verify and Publish"
3. Select compiler version (0.8.20)
4. Paste the flattened source code
5. Enter constructor arguments (ABI-encoded)

### Option 3: Automatic Verification on Deploy

Modify the deployment scripts to verify automatically after deployment:

```javascript
// In deployment script
const contract = await factory.deploy(...args);
await contract.waitForDeployment();

// Auto-verify
await hre.run("verify:verify", {
  address: await contract.getAddress(),
  constructorArguments: args,
});
```

## Getting a BaseScan API Key

1. Go to https://basescan.org/
2. Create an account
3. Go to API Keys section
4. Generate a new key

## Notes

- Verification only needs to happen once per unique bytecode
- If you verify the Factory, all contracts it deploys with the same code will show as "Similar Match" on BaseScan
- Testnet (Base Sepolia) and mainnet (Base) require separate verification

## Future Enhancement

Consider adding a verification step to the admin deploy flow, or creating a script that batch-verifies all deployed contracts.
