-- V39: Tenant Data Isolation
-- Adds organization_id to core tables that need tenant isolation.
-- Enables row-level security for multi-tenant data access.

-- Add org columns to core tables (nullable for backward compatibility)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE job_positions ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Create indexes for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_interviews_org ON interviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_positions_org ON job_positions(organization_id);

-- Tenant access policy table (for fine-grained control)
CREATE TABLE IF NOT EXISTS tenant_access_policies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    resource_type       VARCHAR(50) NOT NULL,    -- INTERVIEW, USER, DOCUMENT, JOB, PIPELINE
    access_level        VARCHAR(30) NOT NULL,    -- FULL, READ_ONLY, NONE
    applies_to_role     VARCHAR(50),             -- NULL = all roles
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_policy UNIQUE (organization_id, resource_type, applies_to_role)
);

CREATE INDEX idx_tenant_policies_org ON tenant_access_policies(organization_id);
