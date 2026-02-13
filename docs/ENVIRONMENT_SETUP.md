# Environment Setup Guide

## Development Environment

### 1. Client Environment (`client/.env`)
Create `client/.env` with:
```bash
# Development environment
VITE_API_BASE_URL=http://localhost:5001/api
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_DEMO_MODE=true
NODE_ENV=development

# Base Sepolia Configuration
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://base-sepolia.blockscout.com
# Note: BaseScan API keys are issued via your Etherscan account (BaseScan uses Etherscan's key system).
VITE_USDC_ADDRESS=0x_your_usdc_address

# Factory Contract (WorkContractFactory)
VITE_FACTORY_ADDRESS=0x_your_factory_address

# Admin Configuration (client-side gating)
VITE_ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### 2. Server Environment (`server/.env`)
Create `server/.env` with:
```bash
# Development environment
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lucidledger_dev
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
PORT=5001
NODE_ENV=development
DEMO_MODE=true

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Privy JWT Verification (REQUIRED for security)
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PRIVY_JWKS_URL=your_privy_jwks_url
PRIVY_ISSUER=privy.io

# Admin Configuration
ADMIN_EMAILS=admin@example.com
```

## Privy Smart Wallet Configuration (Bundler + Paymaster)

Privy handles the bundler/paymaster configuration in the dashboard.

1. Go to **Privy Dashboard → Smart Wallets → Configure chains**
2. Choose **Base Sepolia** (or Base for production)
3. Set **Bundler URL** and **Paymaster URL**
4. Save changes

If you are using Coinbase CDP, the URLs include your **client API key** in the path:
```
https://api.developer.coinbase.com/rpc/v1/base-sepolia/your_client_api_key
https://api.developer.coinbase.com/rpc/v1/base/your_client_api_key
```

## Production Environment

### 1. GitHub Configuration
Set these in your GitHub repository settings (`Settings > Secrets and variables > Actions`).

**Secrets** (sensitive values):
- `SSH_PRIVATE_KEY`: SSH key for EC2 access
- `EC2_HOST`: Production server IP/domain
- `EC2_USER`: SSH username
- `DB_HOST`: Production database host
- `DB_PORT`: Database port (usually 5432)
- `DB_NAME`: Production database name
- `DB_USER`: Production database user
- `DB_PASSWORD`: Production database password
- `PRIVY_APP_SECRET`: Privy app secret (server-side)

**Variables** (non-sensitive config):
- `VITE_PRIVY_APP_ID`: Privy app ID (used by both client and server)
- `PRIVY_JWKS_URL`: Privy JWKS URL
- `PRIVY_ISSUER`: `privy.io`
- `VITE_DEMO_MODE`: `true` or `false`
- `DEMO_MODE`: `true` or `false` (server-side)
- `VITE_BASE_SEPOLIA_CHAIN_ID`: `84532`
- `VITE_BASE_SEPOLIA_RPC`: Base Sepolia RPC URL
- `VITE_BASESCAN_URL`: Block explorer URL
- `VITE_USDC_ADDRESS`: USDC contract address
- `VITE_FACTORY_ADDRESS`: WorkContractFactory address
- `VITE_ADMIN_EMAILS`: Admin email addresses (client-side gating)
- `ADMIN_EMAILS`: Admin email addresses (server-side verification)

### 2. Manual Production Setup (if not using GitHub Actions)
Create `client/.env` on production server:
```bash
VITE_API_BASE_URL=https://lucidledger.co/api
VITE_PRIVY_APP_ID=your_production_privy_app_id
VITE_DEMO_MODE=false
NODE_ENV=production

# Base (production)
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://base-sepolia.blockscout.com
VITE_USDC_ADDRESS=0x_production_usdc_address
VITE_FACTORY_ADDRESS=0x_production_factory_address
```

Create `server/.env` on production server:
```bash
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=lucidledger_prod
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password

PORT=5001
NODE_ENV=production
DEMO_MODE=false

CORS_ORIGIN=https://lucidledger.co
PRIVY_APP_ID=your_production_privy_app_id
PRIVY_APP_SECRET=your_production_privy_app_secret
PRIVY_JWKS_URL=your_production_privy_jwks_url
PRIVY_ISSUER=privy.io
ADMIN_EMAILS=admin@lucidledger.co
```

## Notes
- **JWT Verification:** `PRIVY_APP_ID`, `PRIVY_JWKS_URL`, and `PRIVY_ISSUER` are required for secure backend verification.
- **Bundler/Paymaster:** Configure in Privy dashboard, not in `.env`.
- **USDC address:** Use the network-specific USDC contract address (Base Sepolia vs Base).
