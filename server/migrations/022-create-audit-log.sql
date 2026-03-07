-- Audit log for tracking employer actions for compliance purposes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,

  -- Who performed the action
  actor_type  VARCHAR(50)  NOT NULL, -- 'employer', 'employee', 'system'
  actor_id    BIGINT,
  actor_name  VARCHAR(255),

  -- What action was performed
  action_type        VARCHAR(100) NOT NULL,
  -- Values: 'application_accepted', 'application_rejected', 'applications_bulk_updated',
  --         'contract_deployed', 'contract_status_changed',
  --         'dispute_created', 'dispute_resolved',
  --         'payment_processed'
  action_description TEXT,

  -- What entity was affected
  entity_type       VARCHAR(50) NOT NULL, -- 'job_application', 'deployed_contract', 'dispute', 'payment_transaction'
  entity_id         BIGINT,
  entity_identifier VARCHAR(255), -- Human-readable: job title, contract address, etc.

  -- Change tracking
  old_value JSONB,
  new_value JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_log_actor    ON audit_log (actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action   ON audit_log (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity   ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created  ON audit_log (created_at DESC);

COMMENT ON TABLE audit_log IS 'Compliance audit trail of key employer actions';
