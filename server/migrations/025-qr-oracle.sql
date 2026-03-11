-- Migration 025: QR oracle — kiosk devices, QR tokens, presence events
-- Also extends oracle_verifications CHECK constraint to include 'qr' and 'nfc'

-- -------------------------------------------------------------------------
-- Registered kiosk devices (prevents rogue devices submitting events)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kiosk_devices (
  id            BIGSERIAL PRIMARY KEY,
  device_id     VARCHAR(64)  UNIQUE NOT NULL,
  device_token_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 of the bearer token
  employer_id   BIGINT NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
  site_name     VARCHAR(255),
  status        VARCHAR(20) DEFAULT 'active',     -- active | suspended
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kiosk_devices_token_hash
  ON kiosk_devices(device_token_hash);

CREATE INDEX IF NOT EXISTS idx_kiosk_devices_employer
  ON kiosk_devices(employer_id);

-- -------------------------------------------------------------------------
-- Short-lived QR tokens (ephemeral — consumed on first scan)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_tokens (
  id                    BIGSERIAL PRIMARY KEY,
  token                 VARCHAR(64) UNIQUE NOT NULL,
  deployed_contract_id  BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  employee_id           BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  expires_at            TIMESTAMPTZ NOT NULL,
  used_at               TIMESTAMPTZ NULL,         -- NULL = unused; set atomically on first scan
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_token
  ON qr_tokens(token);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_contract
  ON qr_tokens(deployed_contract_id);

-- -------------------------------------------------------------------------
-- Presence events (permanent audit record — one row per clock-in/out)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presence_events (
  id                      BIGSERIAL PRIMARY KEY,
  deployed_contract_id    BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  employee_id             BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  kiosk_device_id         BIGINT NOT NULL REFERENCES kiosk_devices(id),
  event_type              VARCHAR(20) NOT NULL CHECK (event_type IN ('clock_in', 'clock_out')),
  client_timestamp        TIMESTAMPTZ NOT NULL,   -- timestamp reported by kiosk (informational)
  server_timestamp        TIMESTAMPTZ DEFAULT NOW(), -- authoritative
  latitude                DECIMAL(10,8) NULL,
  longitude               DECIMAL(11,8) NULL,
  gps_accuracy_meters     DECIMAL(8,2)  NULL,
  nonce                   VARCHAR(64)   NULL,
  oracle_verification_id  BIGINT NULL REFERENCES oracle_verifications(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_events_contract
  ON presence_events(deployed_contract_id);

CREATE INDEX IF NOT EXISTS idx_presence_events_employee
  ON presence_events(employee_id, server_timestamp DESC);

-- Nonce uniqueness — prevents replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_presence_events_nonce
  ON presence_events(nonce) WHERE nonce IS NOT NULL;

-- -------------------------------------------------------------------------
-- Extend oracle_verifications to allow 'qr' and 'nfc' oracle types
-- -------------------------------------------------------------------------
ALTER TABLE oracle_verifications
  DROP CONSTRAINT IF EXISTS oracle_verifications_type_check;

ALTER TABLE oracle_verifications
  ADD CONSTRAINT oracle_verifications_type_check
  CHECK (oracle_type IN ('gps', 'image', 'weight', 'time_clock', 'manual', 'qr', 'nfc'));
