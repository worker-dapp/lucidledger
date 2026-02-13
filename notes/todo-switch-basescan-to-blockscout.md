# Switch Block Explorer from BaseScan to Blockscout

## Problem
Production is using BaseScan (`https://sepolia.basescan.org`) but we want Blockscout which has a better UI. The local `.env` already has the correct Blockscout URL but the GitHub Variable was set to BaseScan during deployment setup.

## Fix
1. Go to GitHub repo → Settings → Secrets and variables → Actions → Variables tab
2. Update `VITE_BASESCAN_URL` from `https://sepolia.basescan.org` to `https://base-sepolia.blockscout.com`
3. Redeploy (push to main or manual workflow dispatch)

## Files that use this variable
11 files reference the block explorer URL:
- `client/src/contracts/aaClient.js`
- `client/src/contracts/adminUtils.js`
- `client/src/contracts/deployViaFactory.js`
- `client/src/contracts/deployWorkContract.js`
- `client/src/contracts/workContractInteractions.js`
- `client/src/components/SmartWalletInfo.jsx`
- `client/src/EmployerPages/WorkforceDashboard.jsx`
- `client/src/EmployerPages/Dispute.jsx`
- `client/src/EmployerPages/ContractFactory/AwaitingDeploymentTab.jsx`
- `client/src/EmployeePages/JobTracker.jsx`
- `client/src/pages/MediatorResolution.jsx`

No code changes needed — just the GitHub Variable update and redeploy.
