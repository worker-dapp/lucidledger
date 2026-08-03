ALTER TABLE recruiter_fee_payments
  ADD COLUMN IF NOT EXISTS deployed_contract_id BIGINT REFERENCES deployed_contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recruiter_fee_payments_deployed_contract_id
  ON recruiter_fee_payments(deployed_contract_id);
