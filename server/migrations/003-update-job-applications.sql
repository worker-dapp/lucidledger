-- Update job_applications table to support job_postings and blockchain deployment tracking

-- Add job_posting_id column to link applications to new job_postings table
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS job_posting_id bigint NULL;

-- Add foreign key constraint for job_posting_id
ALTER TABLE public.job_applications
ADD CONSTRAINT job_applications_job_posting_fkey FOREIGN KEY (job_posting_id)
REFERENCES public.job_postings(id) ON DELETE CASCADE;

-- Add offer tracking fields
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS offer_sent_at timestamp with time zone NULL;

ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS offer_accepted_at timestamp with time zone NULL;

-- Add blockchain deployment status tracking
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS blockchain_deployment_status character varying(30) DEFAULT 'not_deployed';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id
    ON public.job_applications (job_posting_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_blockchain_status
    ON public.job_applications (blockchain_deployment_status);

CREATE INDEX IF NOT EXISTS idx_job_applications_offer_sent_at
    ON public.job_applications (offer_sent_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_offer_accepted_at
    ON public.job_applications (offer_accepted_at);

-- Add comments for documentation
COMMENT ON COLUMN public.job_applications.job_posting_id IS 'Reference to job posting (new system) - will replace job_id';
COMMENT ON COLUMN public.job_applications.offer_sent_at IS 'Timestamp when employer sent job offer to worker';
COMMENT ON COLUMN public.job_applications.offer_accepted_at IS 'Timestamp when worker accepted the job offer';
COMMENT ON COLUMN public.job_applications.blockchain_deployment_status IS 'Blockchain deployment status: not_deployed, pending_deployment, deploying, confirmed, failed';

-- Note: We keep job_id for backward compatibility during transition
-- Once all applications are migrated to use job_posting_id, job_id can be made nullable or removed
