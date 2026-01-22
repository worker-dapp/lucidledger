-- Migration: Add mediator tracking to deployed_contracts
-- This enables tracking which mediator is assigned to each contract for dispute resolution

-- Add mediator_id column to deployed_contracts
ALTER TABLE deployed_contracts
ADD COLUMN IF NOT EXISTS mediator_id BIGINT REFERENCES mediators(id);

-- Add index for efficient mediator queries
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_mediator
ON deployed_contracts(mediator_id);

-- Add composite index for disputed contract lookups by mediator
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_status_mediator
ON deployed_contracts(status, mediator_id);

-- Add index for mediator + status queries (common for mediator dashboard)
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_mediator_status
ON deployed_contracts(mediator_id, status)
WHERE mediator_id IS NOT NULL;
