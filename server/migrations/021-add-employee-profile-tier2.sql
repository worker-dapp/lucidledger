-- Add Tier 2 worker profile fields
-- primary_language: required at onboarding going forward (NULL for existing records)
-- availability, bio, willing_to_travel: optional Tier 2 fields surfaced on profile page

ALTER TABLE public.employee
  ADD COLUMN IF NOT EXISTS primary_language VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS availability     VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS bio              TEXT        NULL,
  ADD COLUMN IF NOT EXISTS willing_to_travel BOOLEAN    NULL;

COMMENT ON COLUMN public.employee.primary_language  IS 'Primary spoken language — required at onboarding for employer communication/legal purposes';
COMMENT ON COLUMN public.employee.availability      IS 'Work availability preference, e.g. Full-time, Part-time, Seasonal';
COMMENT ON COLUMN public.employee.bio               IS 'Short worker bio / introduction (optional Tier 2 field)';
COMMENT ON COLUMN public.employee.willing_to_travel IS 'Whether worker is open to travel. NULL = not answered, true/false = answered';
