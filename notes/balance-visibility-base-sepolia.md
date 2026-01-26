# Base Sepolia USDC Balance Visibility Notes

## Likely situation
- Funds can exist on Base Sepolia even when the Dynamic embedded wallet UI shows `$0.00`.
- The wallet widget appears to default to Ethereum mainnet display, so Base Sepolia tokens are not visible there.

## Important distinction
- `VITE_USDC_ADDRESS` is the USDC **token contract address** (global), not a per-user wallet address.
- Each employer/user has a different wallet address; the USDC token contract is shared across all users on that chain.

## How the app should work (independent of widget display)
- The frontend reads balances using a Base Sepolia `publicClient`.
- The USDC balance check uses `primaryWallet.address` and `VITE_USDC_ADDRESS`.
- This means the app can show the correct Base Sepolia USDC balance even if the embedded wallet widget does not.

## Common reasons balance shows as zero in-app
1) The funded address does not match `primaryWallet.address` used by the app.
2) The required amount is higher than the funded amount.
3) The dev server needs a restart after `.env` changes.
4) The wrong token contract address is configured for the current chain.

## Proposed follow-up work
- Add a chain-aware balance panel in the app UI that explicitly shows:
  - Connected wallet address
  - Active chain/network (Base Sepolia)
  - USDC balance on that chain
- Consider hiding or de-emphasizing the Dynamic wallet widget for employers, since it may show the Ethereum mainnet ETH balance (`$0.00`) and create confusion in a Base Sepolia + USDC flow.
- Keep contract addresses hidden from end users; if needed, log them only in dev.

## Quick verification steps (manual)
- Confirm the wallet address on BaseScan: `https://sepolia.basescan.org/address/<wallet>`
- Ensure the USDC token balance appears under token holdings.
- In the app, compare the displayed wallet address with the one funded on BaseScan.
