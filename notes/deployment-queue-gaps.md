# Deployment Queue Gaps

Two related issues discovered during testing of repeat-contract deployments.

## 1. Orphaned On-Chain Contracts

**Problem**: When blockchain deployment succeeds but the subsequent DB write fails, USDC is locked in a contract that has no record in the database. The UI has no handle on it — the employer sees "something went wrong, try again" and the only option is to deploy again, which creates yet another funded contract on-chain.

This was triggered in testing when the `deployed_contracts_unique_job_employee` constraint blocked the DB insert after a successful second deployment for the same worker. Two on-chain contracts were deployed and funded before the constraint was dropped.

**Impact**:
- USDC locked on-chain with no way to refund through the UI
- Employer may re-deploy thinking the first failed, compounding the problem
- Recovery currently requires manual inspection of on-chain events and direct contract calls

**Needed**:
- A recovery flow: after a failed DB write, detect that a contract was already deployed on-chain (by scanning for `ContractDeployed` events or storing the tx hash before the DB write), and offer the employer an "Add to Dashboard" path rather than "Try Again"
- Alternatively, write the DB record first (status: `pending_deployment`) and update it to `active` after the blockchain confirms — this prevents the mismatch entirely
- Admin tool to search for untracked contracts by job/worker address and manually register them

## 2. No Delete/Withdraw from Awaiting Deployment Queue

**Problem**: Once an employer accepts a worker's application and the worker signs (status: `signed`), the application appears in the Awaiting Deployment tab indefinitely. There is no way for the employer to:

- Withdraw the offer if they decide not to proceed
- Remove the item from the queue if the worker is no longer needed (e.g., position filled via another route)
- Notify the worker that the deployment is not happening

**Impact**:
- Signed applications can sit in the queue forever
- Worker has no visibility into whether the employer will actually deploy
- No recourse for the employer short of directly contacting the worker outside the platform

**Needed**:
- "Withdraw Offer" button on items in the Awaiting Deployment queue
  - Sets `application_status` back to `rejected` (or a new `withdrawn` status)
  - Optionally notifies the worker
  - No on-chain action needed (no contract deployed yet, no USDC locked)
- Consider a time limit: if the employer hasn't deployed within N days of worker signing, auto-notify or auto-expire the offer

## Notes

- Both issues are non-blocking for v0.2 but should be tracked as GitHub issues
- Issue 2 is lower risk (no funds involved) — purely a UX gap
- Issue 1 is higher risk — involves locked funds and needs a concrete recovery path before production
