CREATE TABLE IF NOT EXISTS recruiter_fee_payments (
  id                  BIGSERIAL PRIMARY KEY,
  job_posting_id      BIGINT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  recruiter_id        BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  employer_id         BIGINT NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
  fee_amount          DECIMAL(15,2) NOT NULL,
  fee_currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  tx_hash               VARCHAR(255),
  payment_reference_id  VARCHAR(255),
  paid_at             TIMESTAMP,
  notes               TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
