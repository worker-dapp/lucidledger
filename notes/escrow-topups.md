# Escrow Funding and Top-Ups (Wage Theft Flow)

## Current behavior
- Contract deployment checks `job.salary` as a single upfront USDC escrow amount.
- USDC balance check uses the employer's `primaryWallet.address` (Dynamic wallet) on Base Sepolia.
- Gas is sponsored via Coinbase CDP paymaster; USDC must be held by the employer wallet.

## Problem for hourly contracts
- Hourly roles should be funded over time, not only once.
- The current flow treats `job.salary` as a one-time escrow deposit, which may not match hourly work expectations.
- Faucet limits (e.g., 20 USDC) make testing harder when `job.salary` is higher.

## Options
1) Minimal change (fast, low risk)
- Add an "Initial escrow amount" field separate from `job.salary`.
- Use that amount for the deployment USDC check and escrow funding.
- Add a "Top up escrow" action that calls existing `fundContract` logic.

2) Period-based escrow (clear semantics)
- Store `hourly_rate`, `hours_per_pay_period`, `escrow_periods`.
- Calculate `initial_escrow = hourly_rate * hours_per_pay_period * escrow_periods`.
- Allow manual top-ups based on the same period formula.

3) Scheduled top-ups (more automation)
- Add a backend scheduler to trigger employer top-ups on a cadence.
- Requires additional permissions and compliance considerations.

## Suggested direction
- Start with option 1 for immediate testing and UX clarity.
- Move to option 2 once requirements are stable and UI copy is approved.

## Testing note
- To unblock testing with faucet limits, set a smaller initial escrow (e.g., 20 USDC) and fund the employer wallet address on Base Sepolia.
