-- Create job_postings table for actual job listings created from templates
-- Each job posting can be created from a template or customized independently

CREATE TABLE IF NOT EXISTS public.job_postings (
    id bigserial NOT NULL,
    employer_id bigint NOT NULL,
    template_id bigint NULL,

    -- Basic info
    title character varying(255) NOT NULL,
    positions_available integer NOT NULL,
    positions_filled integer DEFAULT 0,
    application_deadline date NULL,
    status character varying(20) DEFAULT 'draft',

    -- Job details (can override template values)
    job_type character varying(50) NULL,
    location_type character varying(50) NULL,
    location character varying(255) NULL,

    -- Compensation (can override template values)
    salary numeric(12, 2) NULL,
    currency character varying(10) DEFAULT 'USD',
    pay_frequency character varying(20) NULL,
    additional_compensation text NULL,
    employee_benefits text NULL,

    -- Oracle verification methods (can override template)
    selected_oracles text NULL,

    -- Job content (can override template values)
    responsibilities text NULL,
    skills text NULL,
    description text NULL,

    -- Company info (copied from employer profile)
    company_name character varying(255) NULL,
    company_description text NULL,

    -- Application tracking
    application_count integer DEFAULT 0,
    accepted_count integer DEFAULT 0,

    -- Timestamps
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT job_postings_pkey PRIMARY KEY (id),
    CONSTRAINT job_postings_employer_fkey FOREIGN KEY (employer_id)
        REFERENCES public.employer(id) ON DELETE CASCADE,
    CONSTRAINT job_postings_template_fkey FOREIGN KEY (template_id)
        REFERENCES public.contract_templates(id) ON DELETE SET NULL,
    CONSTRAINT job_postings_positions_check CHECK (positions_available > 0),
    CONSTRAINT job_postings_positions_filled_check CHECK (positions_filled >= 0),
    CONSTRAINT job_postings_positions_filled_limit CHECK (positions_filled <= positions_available)
) TABLESPACE pg_default;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_employer_id
    ON public.job_postings (employer_id);

CREATE INDEX IF NOT EXISTS idx_job_postings_template_id
    ON public.job_postings (template_id);

CREATE INDEX IF NOT EXISTS idx_job_postings_status
    ON public.job_postings (status);

CREATE INDEX IF NOT EXISTS idx_job_postings_created_at
    ON public.job_postings (created_at);

CREATE INDEX IF NOT EXISTS idx_job_postings_application_deadline
    ON public.job_postings (application_deadline);

-- Comments for documentation
COMMENT ON TABLE public.job_postings IS 'Job postings created from contract templates for hiring workers';
COMMENT ON COLUMN public.job_postings.id IS 'Primary key - auto-incrementing bigint';
COMMENT ON COLUMN public.job_postings.employer_id IS 'Reference to employer who created this job posting';
COMMENT ON COLUMN public.job_postings.template_id IS 'Reference to contract template (NULL if created from scratch)';
COMMENT ON COLUMN public.job_postings.title IS 'Job title displayed to workers';
COMMENT ON COLUMN public.job_postings.positions_available IS 'Number of positions available for this job';
COMMENT ON COLUMN public.job_postings.positions_filled IS 'Number of positions filled (contracts deployed)';
COMMENT ON COLUMN public.job_postings.status IS 'Job status: draft, active, closed';
COMMENT ON COLUMN public.job_postings.application_count IS 'Total number of applications received';
COMMENT ON COLUMN public.job_postings.accepted_count IS 'Number of applications accepted (offers sent)';
COMMENT ON COLUMN public.job_postings.selected_oracles IS 'Comma-separated list of oracle types (GPS,Time Clock,Image,Weight,Manual)';
