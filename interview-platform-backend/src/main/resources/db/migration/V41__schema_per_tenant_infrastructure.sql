-- V41: Schema-per-tenant infrastructure
-- Shared tenant registry in public schema.
-- Each new org gets its own schema with all business tables.

-- Tenant registry (tracks which schemas exist)
CREATE TABLE IF NOT EXISTS tenant_schemas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL UNIQUE,
    schema_name         VARCHAR(100) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, SUSPENDED, DELETED
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    migrated_at         TIMESTAMP WITH TIME ZONE,
    suspended_at        TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_tenant_schema_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX idx_tenant_schemas_org ON tenant_schemas(organization_id);
CREATE INDEX idx_tenant_schemas_name ON tenant_schemas(schema_name);
CREATE INDEX idx_tenant_schemas_status ON tenant_schemas(status);

-- Function to create a new tenant schema with base tables
CREATE OR REPLACE FUNCTION create_tenant_schema(p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);
    
    -- Create core interview tables in the new schema
    EXECUTE format('
        CREATE TABLE %I.interviews (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(300) NOT NULL,
            description TEXT,
            status VARCHAR(30) NOT NULL DEFAULT ''SCHEDULED'',
            type VARCHAR(50),
            mode VARCHAR(30),
            candidate_id UUID NOT NULL,
            scheduled_by UUID NOT NULL,
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            time_zone VARCHAR(50),
            meeting_link VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        )', p_schema_name);
    
    EXECUTE format('
        CREATE TABLE %I.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            type VARCHAR(50),
            title VARCHAR(200),
            message VARCHAR(1000),
            reference_id UUID,
            reference_type VARCHAR(50),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            read_at TIMESTAMP WITH TIME ZONE
        )', p_schema_name);
    
    EXECUTE format('
        CREATE TABLE %I.documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            original_file_name VARCHAR(500),
            s3_key VARCHAR(1000),
            content_type VARCHAR(100),
            file_size BIGINT,
            uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )', p_schema_name);
    
    EXECUTE format('
        CREATE TABLE %I.job_positions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(300) NOT NULL,
            description TEXT,
            department VARCHAR(100),
            location VARCHAR(200),
            employment_type VARCHAR(50),
            status VARCHAR(30) DEFAULT ''OPEN'',
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )', p_schema_name);
    
    EXECUTE format('CREATE INDEX ON %I.interviews(candidate_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.interviews(status)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.notifications(user_id)', p_schema_name);
    EXECUTE format('CREATE INDEX ON %I.documents(user_id)', p_schema_name);
END;
$$ LANGUAGE plpgsql;
