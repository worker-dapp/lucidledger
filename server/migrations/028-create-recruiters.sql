CREATE TABLE IF NOT EXISTS recruiters (
  id             BIGSERIAL PRIMARY KEY,
  email          VARCHAR(255) UNIQUE NOT NULL,
  first_name     VARCHAR(100),
  last_name      VARCHAR(100),
  phone_number   VARCHAR(30),
  wallet_address VARCHAR(100) UNIQUE,
  agency_name    VARCHAR(255),
  status         VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
