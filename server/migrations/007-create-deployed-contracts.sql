-- Create deployed_contracts table for active blockchain-backed worker contracts

CREATE TABLE IF NOT EXISTS public.deployed_contracts (
    id bigserial NOT NULL,
    job_posting_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    employer_id bigint NOT NULL,

    -- Contract details
    contract_address character varying(42) NOT NULL,
    deployment_tx_hash character varying(66) NULL,
    deployed_at timestamp with time zone NULL,

    -- Status
    status character varying(50) DEFAULT 'active',
    started_at timestamp with time zone NULL,
    expected_end_date date NULL,
    actual_end_date date NULL,

    -- Payment tracking
    payment_amount numeric(15, 2) NOT NULL,
    payment_currency character varying(10) DEFAULT 'USD',
    payment_frequency character varying(50) NULL,
    last_payment_date date NULL,
    next_payment_date date NULL,
    total_paid numeric(15, 2) DEFAULT 0,

    -- Oracle configuration
    selected_oracles text NULL,
    verification_status character varying(50) DEFAULT 'pending',
    last_verification_at timestamp with time zone NULL,

    -- Timestamps
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT deployed_contracts_pkey PRIMARY KEY (id),
    CONSTRAINT deployed_contracts_contract_address_key UNIQUE (contract_address),
    CONSTRAINT deployed_contracts_unique_job_employee UNIQUE (job_posting_id, employee_id),
    CONSTRAINT deployed_contracts_job_posting_fkey FOREIGN KEY (job_posting_id)
        REFERENCES public.job_postings(id) ON DELETE CASCADE,
    CONSTRAINT deployed_contracts_employee_fkey FOREIGN KEY (employee_id)
        REFERENCES public.employee(id) ON DELETE CASCADE,
    CONSTRAINT deployed_contracts_employer_fkey FOREIGN KEY (employer_id)
        REFERENCES public.employer(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_employer_status
    ON public.deployed_contracts (employer_id, status);

CREATE INDEX IF NOT EXISTS idx_deployed_contracts_employee_status
    ON public.deployed_contracts (employee_id, status);

CREATE INDEX IF NOT EXISTS idx_deployed_contracts_job_posting
    ON public.deployed_contracts (job_posting_id);

CREATE INDEX IF NOT EXISTS idx_deployed_contracts_status
    ON public.deployed_contracts (status);

-- Comments for documentation
COMMENT ON TABLE public.deployed_contracts IS 'Active blockchain-backed contracts deployed per worker';
COMMENT ON COLUMN public.deployed_contracts.contract_address IS 'On-chain contract address (unique per worker contract)';
COMMENT ON COLUMN public.deployed_contracts.status IS 'Contract status: active, completed, disputed, terminated';
