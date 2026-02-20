ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offer_signature TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS offer_signed_at TIMESTAMP WITH TIME ZONE;
