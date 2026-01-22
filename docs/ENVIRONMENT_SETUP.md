# Environment Setup Guide

## Development Environment

### 1. Client Environment (`client/.env`)
Create `client/.env` with:
```bash
# Development environment
VITE_API_BASE_URL=http://localhost:5001/api
VITE_DYNAMIC_ENV_ID=your_dynamic_env_id_here
VITE_DEMO_MODE=true
NODE_ENV=development

# Base Sepolia Configuration
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://sepolia.basescan.org
VITE_USDC_ADDRESS=0x_your_usdc_address
VITE_MEDIATOR_ADDRESS=0x_your_mediator_address

# Account Abstraction (Coinbase CDP)
VITE_BUNDLER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia
VITE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia
VITE_CDP_API_KEY_NAME=your_cdp_api_key_name
VITE_CDP_API_KEY_PRIVATE_KEY=your_cdp_private_key
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

# JWT Verification (REQUIRED for security)
DYNAMIC_LABS_ENVIRONMENT_ID=your_dynamic_env_id

# Admin Configuration
ADMIN_EMAILS=admin@example.com
```

## Production Environment

### 1. GitHub Secrets
Set these in your GitHub repository settings:
- `VITE_DYNAMIC_ENV_ID`: Your production Dynamic Labs environment ID
- `DYNAMIC_LABS_ENVIRONMENT_ID`: Same as above (for backend JWT verification)
- `DB_HOST`: Production database host
- `DB_PORT`: Database port (usually 5432)
- `DB_NAME`: Production database name
- `DB_USER`: Production database user
- `DB_PASSWORD`: Production database password
- `VITE_CDP_API_KEY_NAME`: Coinbase CDP API key name
- `VITE_CDP_API_KEY_PRIVATE_KEY`: Coinbase CDP private key

### 2. Manual Production Setup (if not using GitHub Actions)
Create `client/.env` on production server:
```bash
VITE_API_BASE_URL=https://lucidledger.co/api
VITE_DYNAMIC_ENV_ID=your_production_dynamic_env_id
VITE_DEMO_MODE=true
NODE_ENV=production

# Base Sepolia (or mainnet for production)
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://sepolia.basescan.org
VITE_USDC_ADDRESS=0x_production_usdc_address
VITE_MEDIATOR_ADDRESS=0x_production_mediator_address

# Account Abstraction
VITE_BUNDLER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia
VITE_PAYMASTER_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia
VITE_CDP_API_KEY_NAME=your_production_cdp_key
VITE_CDP_API_KEY_PRIVATE_KEY=your_production_cdp_private_key
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
DEMO_MODE=true

CORS_ORIGIN=https://lucidledger.co
DYNAMIC_LABS_ENVIRONMENT_ID=your_production_dynamic_env_id
ADMIN_EMAILS=admin@lucidledger.co
```

## Running the Application

### Development
```bash
# Start backend
cd server
npm install
npm run dev

# Start frontend (in another terminal)
cd client
npm install
npm run dev
```

### Production (with Docker)
```bash
# Using nginx compose (recommended for production)
docker-compose -f docker-compose.nginx.yml up -d --build

# Or using regular production compose
docker-compose -f docker-compose.prod.yml up -d --build
```

## Dynamic Labs Configuration

### Environment ID
1. Go to [Dynamic Labs Dashboard](https://app.dynamic.xyz/)
2. Navigate to **Environments**
3. Copy your **Environment ID** (not API key)
4. Use this ID in your `VITE_DYNAMIC_ENV_ID` and `DYNAMIC_LABS_ENVIRONMENT_ID` environment variables

### Smart Wallet Setup (Account Abstraction)
1. In Dynamic Labs Dashboard, go to **Embedded Wallets** > **Configuration**
2. Select **Coinbase** as the embedded wallet provider
3. Enable **Smart Wallet** option
4. Configure **Base Sepolia** (chain ID 84532) as the default chain
5. Save configuration

## Account Abstraction (Coinbase CDP) Setup

Account Abstraction enables gas-free transactions for users. All transaction fees are sponsored by the platform.

### 1. Get CDP API Keys
1. Go to [Coinbase Developer Portal](https://portal.cdp.coinbase.com/)
2. Create a new project or select existing
3. Navigate to **API Keys**
4. Create a new API key with paymaster permissions
5. Copy the **API Key Name** and **Private Key**

### 2. Configure Bundler & Paymaster
The bundler and paymaster URLs are provided by Coinbase CDP:
- **Base Sepolia**: `https://api.developer.coinbase.com/rpc/v1/base-sepolia`
- **Base Mainnet**: `https://api.developer.coinbase.com/rpc/v1/base`

### 3. Fund Your Paymaster
1. In CDP Portal, navigate to **Paymaster**
2. Deposit funds (ETH on Base Sepolia/Mainnet)
3. Set spending limits if desired

### 4. Testing AA Integration
1. Clear browser localStorage and login fresh
2. The wallet address should be a smart contract (verify on BaseScan)
3. Deploy a test contract - no ETH should be deducted
4. Check BaseScan - transaction should show paymaster paid gas

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5001/api` | `https://lucidledger.co/api` | Frontend API endpoint |
| `VITE_DYNAMIC_ENV_ID` | Your dev env ID | Your prod env ID | Dynamic Labs environment ID |
| `DYNAMIC_LABS_ENVIRONMENT_ID` | Your dev env ID | Your prod env ID | Backend JWT verification |
| `VITE_DEMO_MODE` | `true` | `true`/`false` | Shows demo mode banners (frontend) |
| `DEMO_MODE` | `true` | `true`/`false` | Demo features (backend) |
| `NODE_ENV` | `development` | `production` | Node environment |
| `DB_HOST` | `localhost` | Production DB host | Database host |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://lucidledger.co` | Allowed CORS origins |
| `VITE_BUNDLER_URL` | CDP Base Sepolia URL | CDP URL | AA bundler endpoint |
| `VITE_PAYMASTER_URL` | CDP Base Sepolia URL | CDP URL | AA paymaster endpoint |
| `VITE_CDP_API_KEY_NAME` | Your CDP key name | Your CDP key name | CDP authentication |
| `VITE_USDC_ADDRESS` | Base Sepolia USDC | Production USDC | USDC token address |
| `VITE_MEDIATOR_ADDRESS` | Test mediator | Production mediator | Default dispute mediator |

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **JWT Verification** - `DYNAMIC_LABS_ENVIRONMENT_ID` is required for secure JWT verification. Without it, the backend falls back to insecure token decoding.
3. **CDP Keys** - Keep your CDP private key secure. It controls gas sponsorship spending.
4. **ADMIN_EMAILS** - Only trusted emails should be in this list as they have admin access.
