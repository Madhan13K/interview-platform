-- V43: Bulk Operations API v2
-- Tracks batch operations with item-level status reporting

CREATE TABLE bulk_operations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID,
    operation_type      VARCHAR(30) NOT NULL,    -- CREATE, UPDATE, DELETE
    entity_type         VARCHAR(50) NOT NULL,    -- INTERVIEW, CANDIDATE, JOB
    total_items         INTEGER NOT NULL,
    processed_items     INTEGER DEFAULT 0,
    success_count       INTEGER DEFAULT 0,
    failure_count       INTEGER DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED
    error_summary       JSONB,                   -- [{index, error}]
    submitted_by        UUID NOT NULL REFERENCES users(id),
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bulk_ops_org ON bulk_operations(organization_id);
CREATE INDEX idx_bulk_ops_status ON bulk_operations(status);
CREATE INDEX idx_bulk_ops_submitted ON bulk_operations(submitted_by);
