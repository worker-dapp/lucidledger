-- Create oracle_verifications table for contract verification events

CREATE TABLE IF NOT EXISTS public.oracle_verifications (
    id bigserial NOT NULL,
    deployed_contract_id bigint NOT NULL,
    oracle_type character varying(50) NOT NULL,

    -- Verification data
    verification_status character varying(50) DEFAULT 'pending',
    verified_at timestamp with time zone NULL,
    verified_by bigint NULL,

    -- GPS oracle data
    latitude numeric(10, 8) NULL,
    longitude numeric(11, 8) NULL,
    location_name text NULL,
    gps_accuracy_meters numeric(10, 2) NULL,

    -- Image oracle data
    image_url text NULL,
    image_hash character varying(66) NULL,

    -- Weight oracle data
    weight_recorded numeric(10, 2) NULL,
    weight_unit character varying(20) NULL,

    -- Time clock oracle data
    clock_in_time timestamp with time zone NULL,
    clock_out_time timestamp with time zone NULL,
    hours_worked numeric(5, 2) NULL,

    -- Blockchain data
    tx_hash character varying(66) NULL,
    block_number bigint NULL,

    -- Metadata
    notes text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT oracle_verifications_pkey PRIMARY KEY (id),
    CONSTRAINT oracle_verifications_type_check CHECK (
        oracle_type IN ('gps', 'image', 'weight', 'time_clock', 'manual')
    ),
    CONSTRAINT oracle_verifications_contract_fkey FOREIGN KEY (deployed_contract_id)
        REFERENCES public.deployed_contracts(id) ON DELETE CASCADE,
    CONSTRAINT oracle_verifications_verified_by_fkey FOREIGN KEY (verified_by)
        REFERENCES public.employee(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_oracle_verifications_contract
    ON public.oracle_verifications (deployed_contract_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_oracle_verifications_status
    ON public.oracle_verifications (verification_status);

-- Comments for documentation
COMMENT ON TABLE public.oracle_verifications IS 'Oracle verification events tied to deployed contracts';
COMMENT ON COLUMN public.oracle_verifications.oracle_type IS 'gps, image, weight, time_clock, manual';
