# TODO: Review Completed Contracts Page

## Current State

**File**: `client/src/EmployerPages/ReviewCompletedContracts.jsx`
**Route**: `/review-completed-contracts`

The page displays jobs with `status === 'closed'` and has a "Sign the Contract" button that currently only shows an alert with a TODO comment.

This is **separate from the payment flow** — payment approval happens in `/workforce` via `approveAndPay()`.

## Questions to Answer

1. What is the intended purpose of this page?
   - Compliance/record-keeping?
   - Generating PDF receipts?
   - On-chain attestation of completed work?
   - Viewing historical contract data?

2. What should "Sign the Contract" do?
   - Generate a downloadable PDF summary?
   - Create an on-chain record/attestation?
   - Link to BaseScan transaction history?
   - Something else?

3. Is this page even needed, or should closed contracts just be viewable in `/workforce` with a different filter?

## Related Files

- `/workforce` (WorkforceDashboard.jsx) — handles live contract management and payment approval
- `/closed-contracts` (ClosedContracts.jsx) — may overlap with this page's purpose

## Action

Return to this page once the core payment flow is tested and working. Determine the compliance/documentation requirements and implement accordingly.
