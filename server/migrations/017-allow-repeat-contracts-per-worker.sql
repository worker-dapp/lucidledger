-- Allow the same worker to have multiple contracts on the same job posting,
-- as long as only one is active at a time. Previously the blanket unique constraint
-- on (job_posting_id, employee_id) prevented re-deployment after a contract completed.

-- Drop the old blanket unique constraint
ALTER TABLE deployed_contracts
  DROP CONSTRAINT IF EXISTS deployed_contracts_unique_job_employee;

-- Replace with a partial unique index: only one active contract per worker per job
-- at a time. Completed/refunded/terminated contracts do not block new ones.
CREATE UNIQUE INDEX IF NOT EXISTS idx_deployed_contracts_unique_active_job_employee
  ON deployed_contracts (job_posting_id, employee_id)
  WHERE status NOT IN ('completed', 'refunded', 'terminated');
