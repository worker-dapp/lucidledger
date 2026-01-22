-- Create mediators table for approved platform mediators
-- Mediators are approved by Lucid Ledger admins and can resolve contract disputes

CREATE TABLE IF NOT EXISTS public.mediators (
    id bigserial NOT NULL,

    -- Contact info (for whitelist matching)
    email character varying(255) NOT NULL,
    phone_number character varying(30) NULL,

    -- Profile info
    first_name character varying(100) NULL,
    last_name character varying(100) NULL,

    -- Wallet address (populated after first login)
    wallet_address character varying(100) NULL,

    -- Status
    status character varying(20) DEFAULT 'active' NOT NULL,

    -- Timestamps
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT mediators_pkey PRIMARY KEY (id),
    CONSTRAINT mediators_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_mediators_email
    ON public.mediators (email);

CREATE INDEX IF NOT EXISTS idx_mediators_status
    ON public.mediators (status);

CREATE INDEX IF NOT EXISTS idx_mediators_wallet
    ON public.mediators (wallet_address);

-- Comments for documentation
COMMENT ON TABLE public.mediators IS 'Approved platform mediators who can resolve contract disputes';
COMMENT ON COLUMN public.mediators.email IS 'Email address used for whitelist matching during login';
COMMENT ON COLUMN public.mediators.wallet_address IS 'Dynamic Labs wallet address, populated after first mediator login';
COMMENT ON COLUMN public.mediators.status IS 'Mediator status: active, inactive';
