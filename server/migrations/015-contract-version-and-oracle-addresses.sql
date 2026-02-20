-- Add contract version and oracle address tracking to deployed_contracts
-- v1 = ManualWorkContract (legacy), v2 = WorkContract (with oracle support)

ALTER TABLE deployed_contracts
  ADD COLUMN IF NOT EXISTS contract_version SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS oracle_addresses TEXT;
