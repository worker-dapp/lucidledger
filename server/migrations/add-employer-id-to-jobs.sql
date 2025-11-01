-- Add employer_id column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS employer_id bigint NULL;

-- Add foreign key constraint
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_employer_fkey FOREIGN KEY (employer_id) 
REFERENCES public.employer(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON public.jobs (employer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.employer_id IS 'Reference to the employer who created this job posting';

