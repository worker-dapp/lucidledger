-- Add contract_snapshot JSONB column to deployed_contracts
-- Stores an immutable point-in-time capture of job posting terms at the moment
-- of contract deployment. Later edits to the job posting do not affect this record.

ALTER TABLE public.deployed_contracts
  ADD COLUMN IF NOT EXISTS contract_snapshot JSONB NULL;

COMMENT ON COLUMN public.deployed_contracts.contract_snapshot IS
  'Immutable snapshot of job posting terms captured at deployment time (title, pay, schedule, responsibilities, etc.)';
