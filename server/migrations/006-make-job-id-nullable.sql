-- Migration 006: Make job_id nullable in saved_jobs and job_applications
-- This allows the new job_posting_id system to work without requiring the old job_id

-- Make job_id nullable in saved_jobs table
ALTER TABLE public.saved_jobs
ALTER COLUMN job_id DROP NOT NULL;

-- Make job_id nullable in job_applications table  
ALTER TABLE public.job_applications
ALTER COLUMN job_id DROP NOT NULL;

-- Make job_posting_id NOT NULL going forward (for new records)
-- But first check if there are any records without job_posting_id and skip if so
DO $$
BEGIN
  -- Only add NOT NULL constraint if all existing records have job_posting_id
  IF NOT EXISTS (SELECT 1 FROM public.saved_jobs WHERE job_posting_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.saved_jobs ALTER COLUMN job_posting_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Skipping NOT NULL on saved_jobs.job_posting_id - some records still have NULL values';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.job_applications WHERE job_posting_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.job_applications ALTER COLUMN job_posting_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Skipping NOT NULL on job_applications.job_posting_id - some records still have NULL values';
  END IF;
END $$;

-- Add unique constraint on employee_id + job_posting_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_jobs_unique_employee_job_posting'
  ) THEN
    ALTER TABLE public.saved_jobs 
    ADD CONSTRAINT saved_jobs_unique_employee_job_posting UNIQUE (employee_id, job_posting_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_unique_employee_job_posting'
  ) THEN
    ALTER TABLE public.job_applications 
    ADD CONSTRAINT job_applications_unique_employee_job_posting UNIQUE (employee_id, job_posting_id);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.saved_jobs.job_id IS 'DEPRECATED: Old reference to jobs table. Use job_posting_id instead.';
COMMENT ON COLUMN public.job_applications.job_id IS 'DEPRECATED: Old reference to jobs table. Use job_posting_id instead.';
