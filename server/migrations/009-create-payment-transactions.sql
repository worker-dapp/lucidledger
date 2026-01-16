-- Create payment_transactions table for contract payment tracking

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id bigserial NOT NULL,
    deployed_contract_id bigint NOT NULL,

    -- Transaction details
    amount numeric(15, 2) NOT NULL,
    currency character varying(10) DEFAULT 'USD',
    payment_type character varying(50) NULL,

    -- Blockchain data
    tx_hash character varying(66) NULL,
    block_number bigint NULL,
    from_address character varying(42) NULL,
    to_address character varying(42) NULL,

    -- Status
    status character varying(50) DEFAULT 'pending',
    processed_at timestamp with time zone NULL,

    -- Metadata
    notes text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT payment_transactions_tx_hash_key UNIQUE (tx_hash),
    CONSTRAINT payment_transactions_type_check CHECK (
        payment_type IN ('regular', 'bonus', 'penalty', 'final')
    ),
    CONSTRAINT payment_transactions_contract_fkey FOREIGN KEY (deployed_contract_id)
        REFERENCES public.deployed_contracts(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_contract
    ON public.payment_transactions (deployed_contract_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
    ON public.payment_transactions (status);

-- Comments for documentation
COMMENT ON TABLE public.payment_transactions IS 'Payment transactions tied to deployed contracts';
COMMENT ON COLUMN public.payment_transactions.payment_type IS 'regular, bonus, penalty, final';
