-- Create contract_templates table for reusable job contract templates
-- This allows employers to create template contracts once and reuse for multiple job postings

CREATE TABLE IF NOT EXISTS public.contract_templates (
    id bigserial NOT NULL,
    employer_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text NULL,

    -- Job details
    job_type character varying(50) NULL,
    location_type character varying(50) NULL,

    -- Compensation
    base_salary numeric(12, 2) NULL,
    currency character varying(10) DEFAULT 'USD',
    pay_frequency character varying(20) NULL,
    additional_compensation text NULL,
    employee_benefits text NULL,

    -- Oracle verification methods
    selected_oracles text NULL,

    -- Job content
    responsibilities text NULL,
    skills text NULL,

    -- Usage tracking
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone NULL,

    -- Timestamps
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT contract_templates_pkey PRIMARY KEY (id),
    CONSTRAINT contract_templates_employer_fkey FOREIGN KEY (employer_id)
        REFERENCES public.employer(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_employer_id
    ON public.contract_templates (employer_id);

CREATE INDEX IF NOT EXISTS idx_contract_templates_created_at
    ON public.contract_templates (created_at);

CREATE INDEX IF NOT EXISTS idx_contract_templates_usage_count
    ON public.contract_templates (usage_count);

-- Comments for documentation
COMMENT ON TABLE public.contract_templates IS 'Reusable contract templates for employers to create multiple job postings';
COMMENT ON COLUMN public.contract_templates.id IS 'Primary key - auto-incrementing bigint';
COMMENT ON COLUMN public.contract_templates.employer_id IS 'Reference to employer who owns this template';
COMMENT ON COLUMN public.contract_templates.name IS 'Template name (e.g., "Sewing Operator", "Quality Control Inspector")';
COMMENT ON COLUMN public.contract_templates.usage_count IS 'Number of times this template has been used to create job postings';
COMMENT ON COLUMN public.contract_templates.last_used_at IS 'Timestamp when this template was last used';
COMMENT ON COLUMN public.contract_templates.selected_oracles IS 'Comma-separated list of oracle types (GPS,Time Clock,Image,Weight,Manual)';
COMMENT ON COLUMN public.contract_templates.job_type IS 'Employment type: Full-time, Part-time, Contract, Temporary';
COMMENT ON COLUMN public.contract_templates.location_type IS 'Work location: On-site, Remote, Hybrid';
