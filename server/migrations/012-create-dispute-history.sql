-- Create dispute_history table for audit trail of all disputes
-- This provides a permanent record of disputes for compliance purposes

CREATE TABLE IF NOT EXISTS dispute_history (
    id BIGSERIAL PRIMARY KEY,
    deployed_contract_id BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
    raised_by_employee_id BIGINT REFERENCES employee(id) ON DELETE SET NULL,
    raised_by_employer_id BIGINT REFERENCES employer(id) ON DELETE SET NULL,
    raised_by_role VARCHAR(20) NOT NULL CHECK (raised_by_role IN ('employee', 'employer')),
    raised_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    mediator_id BIGINT REFERENCES mediators(id) ON DELETE SET NULL,
    mediator_assigned_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution VARCHAR(50) CHECK (resolution IN ('worker_paid', 'employer_refunded', 'split', 'cancelled')),
    resolution_notes TEXT,
    resolution_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dispute_history_contract ON dispute_history(deployed_contract_id);
CREATE INDEX IF NOT EXISTS idx_dispute_history_mediator ON dispute_history(mediator_id);
CREATE INDEX IF NOT EXISTS idx_dispute_history_raised_at ON dispute_history(raised_at);
CREATE INDEX IF NOT EXISTS idx_dispute_history_resolution ON dispute_history(resolution);

-- Comments for documentation
COMMENT ON TABLE dispute_history IS 'Audit trail of all contract disputes for compliance purposes';
COMMENT ON COLUMN dispute_history.raised_by_role IS 'Who raised the dispute: employee or employer';
COMMENT ON COLUMN dispute_history.resolution IS 'Outcome: worker_paid (worker wins), employer_refunded (employer wins), split (funds divided), cancelled (dispute withdrawn)';
