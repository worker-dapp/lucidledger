# Deploying a New WorkContractFactory

This guide explains how to deploy a new `WorkContractFactory` contract on Base Sepolia (or mainnet).

## Why Deploy a New Factory?

You need a new factory when:
- **Wallet mismatch**: The on-chain factory admin doesn't match your current Privy smart wallet
- **Contract upgrade**: You've updated the `ManualWorkContract` or `WorkContractFactory` Solidity code
- **Fresh start**: Moving to a new environment or resetting testnet state

## Prerequisites

1. **ETH for gas**: The deployer wallet needs Base Sepolia ETH (get from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
2. **Your Privy smart wallet address**: This will be set as the factory admin (find it at `/admin/deploy-factory` or in browser console)
3. **A deployer private key**: Any wallet with ETH — this is NOT the admin, just pays gas

## Deployment Steps

### 1. Configure Environment

Create or update `contracts/.env`:

```bash
# Private key for the wallet that pays gas (NOT the admin)
# Get this from MetaMask or another wallet with Base Sepolia ETH
PRIVATE_KEY=your_private_key_without_0x_prefix

# Your Privy smart wallet address - this becomes the factory admin
# Find this at /admin/deploy-factory under "Your Smart Wallet"
ADMIN_ADDRESS=0x1BaC2083006338a67b858f3D64876ACa37a2B9aD

# Optional: for contract verification on BaseScan
BASESCAN_API_KEY=your_basescan_api_key
```

### 2. Compile Contracts

```bash
cd contracts
npm install
npx hardhat compile
```

### 3. Deploy

```bash
npx hardhat run scripts/deployFactory.js --network baseSepolia
```

Output will show:
```
Deploying to network: baseSepolia
Using USDC address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Using admin address: 0x1BaC2083006338a67b858f3D64876ACa37a2B9aD
Deploying with account: 0x... (the gas payer)

============================================================
WorkContractFactory deployed to: 0xNEW_FACTORY_ADDRESS
============================================================
```

### 4. Update Frontend Configuration

Edit `client/.env`:

```bash
VITE_FACTORY_ADDRESS=0xNEW_FACTORY_ADDRESS
```

### 5. Restart Frontend

```bash
# If using Docker:
docker compose down && docker compose up -d

# If running locally:
cd client && npm run dev
```

### 6. Verify Deployment

1. Go to `/admin/deploy-factory`
2. Confirm "Wallet Mismatch" warning is **gone**
3. Verify "On-Chain Admin" matches "Your Smart Wallet"

## Optional: Verify on BaseScan

```bash
npx hardhat verify --network baseSepolia \
  0xNEW_FACTORY_ADDRESS \
  0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  0xYOUR_ADMIN_ADDRESS
```

## Understanding Admin vs Deployer

| Role | Address | Purpose |
|------|---------|---------|
| **Deployer** | From `PRIVATE_KEY` | Pays gas for deployment, has no ongoing role |
| **Admin** | From `ADMIN_ADDRESS` | Your Privy smart wallet; can call `assignMediator()` on work contracts |

The deployer is just a gas payer. The admin is stored on-chain in the factory and is the only address that can assign mediators to disputed contracts.

## Troubleshooting

### "Insufficient funds"
The deployer wallet needs Base Sepolia ETH. Get some from the faucet.

### "ADMIN_ADDRESS is required"
Make sure `contracts/.env` has `ADMIN_ADDRESS` set to your Privy smart wallet.

### Wallet mismatch still shows after deployment
- Double-check you updated `VITE_FACTORY_ADDRESS` in `client/.env`
- Restart the frontend to pick up the new env var
- Hard refresh the browser (Cmd+Shift+R)

## Mainnet Deployment

For Base mainnet, use `--network baseMainnet` and ensure:
- Deployer has real ETH on Base
- `ADMIN_ADDRESS` is your production Privy smart wallet
- Update `client/.env` for production
