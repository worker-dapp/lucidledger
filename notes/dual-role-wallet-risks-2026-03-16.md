# Dual-Role Wallet Risks

**Date**: 2026-03-16
**Status**: Deferred — needs architectural decision before implementing autosweep

## Background

LucidLedger allows a single Privy account to hold both an employee and employer profile, sharing the same `smartWalletAddress`. This creates two risks that need to be resolved.

---

## Risk 1: Wallet Address Exposure

**Issue**: The employer side of the app displays wallet addresses (profile, contract deployment UI, etc.). Any worker who also creates an employer account can see their own wallet address by switching to the employer view — defeating any legal intent to keep wallet addresses hidden from workers.

**Root cause**: UI/disclosure problem. The wallet is not hidden at the data layer — both roles use the same address.

**Options**:
- Enforce account separation (different Privy accounts for each role)
- Audit and remove wallet displays from employer UI (fragile — leaks through contract deployment flow)
- Re-evaluate legal requirement: if the employer side is accessible to any user, the protection is already broken

---

## Risk 2: Autosweep Draining Employer Funds

**Issue**: If autosweep is implemented on the employee side and an employer also has an employee profile, autosweep could drain USDC sitting in their smart wallet before it gets locked into escrow.

**Safe zone**: Funds already deployed into a `ManualWorkContract` escrow are not reachable by autosweep.

**Risk window**: USDC in the employer's smart wallet that hasn't been escrowed yet (e.g., pre-loaded funds, or returned funds after a refund/termination).

**Options**:
- Add autosweep guard: before sweeping, check if the wallet also belongs to an active employer record with deployed or pending contracts — block sweep if so
- Require employers to fund escrow from an external wallet (not the Privy smart wallet), decoupling employer funds from sweep-eligible wallets entirely
- Enforce account separation (cleanest long-term fix for both risks)

---

## Recommended Next Steps

1. **Legal clarification**: What exactly is the requirement around hiding wallet addresses from workers? Is the current dual-role design compatible with it at all?
2. **Autosweep guard (near-term)**: Implement employer-profile check before any autosweep fires.
3. **Account separation (long-term)**: Consider requiring separate Privy accounts for employee vs employer roles to cleanly resolve both issues.
