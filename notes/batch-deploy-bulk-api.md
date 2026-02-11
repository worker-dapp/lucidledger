# Batch Deployment DB Write: Bulk API Proposal

## Context
The contract deployment flow supports on-chain batching via `WorkContractFactory.deployBatch` and the client AA batch call. After a successful batch deploy, the frontend currently loops and creates `DeployedContract` records one-by-one, then calls a bulk status update for applications.

This works, but it is not atomic and creates N+1 API calls for large batches.

## Proposed Change
Add a backend endpoint to accept the entire batch result and perform all writes in a single DB transaction.

## Benefits
- Atomicity: all deployed contracts and application status updates succeed or fail together.
- Fewer round trips: one request instead of N+1, reducing latency and server load.
- Simpler error handling and retries: a single idempotent request can be retried safely.
- Stronger data consistency: enforce cross-record invariants within one transaction.

## Implementation Plan
1. Add a new endpoint (server):
   - Example: `POST /api/deployed-contracts/bulk`.
   - Payload: `deployments[]` containing job/employee/employer IDs, contract address, payment details, tx hash, and desired application status.
   - Validate inputs and dedupe by `contract_address` or `(job_id, employee_id)`.

2. Implement DB transaction:
   - Use a transaction to bulk insert `DeployedContract` records.
   - Update related application statuses within the same transaction.
   - Return a summary `{createdCount, updatedCount, skippedCount}`.

3. Client update:
   - Replace the per-record `createDeployedContract` loop with a single bulk call.
   - Keep the existing UI status flow and receipt parsing unchanged.

4. Idempotency:
   - Enforce uniqueness on `deployed_contracts.contract_address` (if not already).
   - If a record exists, skip or upsert based on `contract_address`.

## Notes
- This is an optimization and consistency improvement, not a blocker for batching.
- If desired, include a `batchId` (e.g., tx hash) to trace a single on-chain batch.
