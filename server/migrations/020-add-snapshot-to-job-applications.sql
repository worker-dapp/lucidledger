-- Add contract_snapshot JSONB column to job_applications
-- Stores an immutable point-in-time capture of job posting terms at the moment
-- the worker signs the offer. This is the source of truth for what the worker
-- agreed to. The snapshot is copied forward to deployed_contracts at deployment.

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS contract_snapshot JSONB NULL;

COMMENT ON COLUMN public.job_applications.contract_snapshot IS
  'Immutable snapshot of job posting terms captured when the worker signs the offer. Source of truth — copied to deployed_contracts at deployment.';
