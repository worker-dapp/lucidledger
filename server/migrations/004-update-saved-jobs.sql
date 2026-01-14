-- Update saved_jobs table to support job_postings

-- Add job_posting_id column to link saved jobs to new job_postings table
ALTER TABLE public.saved_jobs
ADD COLUMN IF NOT EXISTS job_posting_id bigint NULL;

-- Add foreign key constraint for job_posting_id
ALTER TABLE public.saved_jobs
ADD CONSTRAINT saved_jobs_job_posting_fkey FOREIGN KEY (job_posting_id)
REFERENCES public.job_postings(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_posting_id
    ON public.saved_jobs (job_posting_id);

-- Add comment for documentation
COMMENT ON COLUMN public.saved_jobs.job_posting_id IS 'Reference to job posting (new system) - will replace job_id';

-- Note: We keep job_id for backward compatibility during transition
-- Once all saved jobs are migrated to use job_posting_id, job_id can be made nullable or removed
