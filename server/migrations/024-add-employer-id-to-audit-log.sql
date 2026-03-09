-- Migration 024: Add employer_id to audit_log for cross-actor filtering
-- Allows the Compliance Hub to show all events related to an employer's contracts,
-- including disputes raised by employees and resolutions by mediators.

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS employer_id BIGINT NULL REFERENCES employer(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_employer_id ON audit_log(employer_id);
