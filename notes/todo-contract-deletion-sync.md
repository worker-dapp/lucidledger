# TODO: Contract Deletion Sync Issue

## Problem

When an employer deletes a contract from the Contract Library, it remains visible and shows as "Active" on the employee/worker side (Job Tracker).

## Expected Behavior

Deleting a contract should either:
1. Cascade delete or update related records so workers don't see stale contracts
2. Soft-delete with a status change that hides it from both sides
3. Prevent deletion if contract is already signed/active (require cancellation flow instead)

## Where to Fix

- **Backend**: Check `DeployedContractController` delete logic — may need to update `JobApplication` or notify worker
- **Frontend (Worker)**: `JobTracker.jsx` should filter out deleted/invalid contracts
- **Database**: Review foreign key constraints and cascade rules on `deployed_contracts` table

## Related

- Employer side: `/contract-factory` (ContractFactory.jsx)
- Worker side: `/job-tracker` (JobTracker.jsx)
- API: `DELETE /api/deployed-contracts/:id`
