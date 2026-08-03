ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS recruiter_id         BIGINT REFERENCES recruiters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recruiter_fee_amount  DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS recruiter_fee_currency VARCHAR(10) DEFAULT 'USD';
