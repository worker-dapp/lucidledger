-- Add approval status fields to employer table
ALTER TABLE public.employer
ADD COLUMN IF NOT EXISTS approval_status character varying(20) DEFAULT 'pending' NOT NULL,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS approved_by character varying(255) NULL,
ADD COLUMN IF NOT EXISTS rejection_reason text NULL;

-- Migrate existing employers to 'approved' (they were implicitly approved)
UPDATE public.employer SET approval_status = 'approved' WHERE approval_status = 'pending';

-- Index for filtering by approval status
CREATE INDEX IF NOT EXISTS idx_employer_approval_status ON public.employer (approval_status);
