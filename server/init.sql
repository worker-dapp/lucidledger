-- Lucid Ledger Database Initialization

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location_type VARCHAR(50),
  location VARCHAR(255),
  company_name VARCHAR(255),
  notification_email VARCHAR(255),
  reference_code VARCHAR(100),
  job_type VARCHAR(100),
  salary NUMERIC(12,2),
  currency VARCHAR(10),
  pay_frequency VARCHAR(50),
  additional_compensation TEXT,
  employee_benefits TEXT,
  description TEXT,
  selected_oracles TEXT,
  verification_notes TEXT,
  responsibilities TEXT,
  skills TEXT,
  associated_skills TEXT,
  company_description TEXT,
  employer_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for jobs updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create profile table to store extended user information
CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(50),
  country_code VARCHAR(8),
  country VARCHAR(100),
  zip_code VARCHAR(20),
  state VARCHAR(100),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for profile updated_at
CREATE TRIGGER update_profile_updated_at
  BEFORE UPDATE ON profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
