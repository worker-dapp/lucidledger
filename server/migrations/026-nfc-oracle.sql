-- Migration 026: NFC oracle — badge registry
-- kiosk_devices, presence_events, and oracle_verifications are already
-- created and extended in migration 025; no changes needed to those tables.

-- -------------------------------------------------------------------------
-- NFC badge registry (employer-scoped, static UID ↔ employee assignment)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nfc_badges (
  id            BIGSERIAL PRIMARY KEY,
  badge_uid     VARCHAR(64)  NOT NULL,              -- NFC tag UID (e.g. "04:A3:B2:12:34:56:78")
  employer_id   BIGINT NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
  employee_id   BIGINT NULL  REFERENCES employee(id) ON DELETE SET NULL,  -- nullable: unassigned/returned
  label         VARCHAR(255),                        -- optional ("Badge #47", worker name)
  status        VARCHAR(20) DEFAULT 'active',        -- 'active' | 'suspended' | 'lost'
  registered_at TIMESTAMPTZ DEFAULT NOW(),

  -- One UID per employer (same physical badge can be at two employers)
  CONSTRAINT uq_nfc_badge_uid_employer UNIQUE (badge_uid, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_nfc_badges_employer
  ON nfc_badges(employer_id);

CREATE INDEX IF NOT EXISTS idx_nfc_badges_employee
  ON nfc_badges(employee_id);

CREATE INDEX IF NOT EXISTS idx_nfc_badges_uid
  ON nfc_badges(badge_uid);
