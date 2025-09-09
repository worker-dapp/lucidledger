export const createEmployerTableSQL = `
CREATE TABLE IF NOT EXISTS employer (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(30),
  email VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(100),
  street_address VARCHAR(255),
  country VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  city VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure updated_at trigger exists for employer
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_employer_updated_at'
  ) THEN
    CREATE TRIGGER update_employer_updated_at
      BEFORE UPDATE ON employer
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
`;

export default createEmployerTableSQL;


