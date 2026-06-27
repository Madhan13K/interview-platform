-- V42: Custom Fields Engine
-- Allows organizations to define custom fields on any entity type.
-- Supports: TEXT, NUMBER, DATE, BOOLEAN, SELECT, MULTI_SELECT, URL, EMAIL

CREATE TABLE custom_field_definitions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    entity_type         VARCHAR(50) NOT NULL,    -- INTERVIEW, CANDIDATE, JOB, PIPELINE, APPLICATION
    field_name          VARCHAR(100) NOT NULL,
    field_key           VARCHAR(100) NOT NULL,   -- machine-readable key (snake_case)
    field_type          VARCHAR(30) NOT NULL,    -- TEXT, NUMBER, DATE, BOOLEAN, SELECT, MULTI_SELECT, URL, EMAIL
    description         VARCHAR(500),
    is_required         BOOLEAN DEFAULT FALSE,
    default_value       VARCHAR(500),
    options             JSONB,                   -- for SELECT/MULTI_SELECT: ["Option A", "Option B"]
    validation_regex    VARCHAR(500),            -- optional regex validation
    display_order       INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_custom_field_org_entity_key UNIQUE (organization_id, entity_type, field_key)
);

CREATE TABLE custom_field_values (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    entity_id           UUID NOT NULL,           -- the target entity's ID
    entity_type         VARCHAR(50) NOT NULL,    -- redundant for fast queries
    value_text          TEXT,                    -- stores all types as text
    value_number        DECIMAL(20,5),           -- for NUMBER type
    value_date          TIMESTAMP WITH TIME ZONE,-- for DATE type
    value_boolean       BOOLEAN,                 -- for BOOLEAN type
    value_json          JSONB,                   -- for MULTI_SELECT arrays
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_field_value_entity UNIQUE (field_definition_id, entity_id)
);

CREATE INDEX idx_custom_field_defs_org ON custom_field_definitions(organization_id);
CREATE INDEX idx_custom_field_defs_entity ON custom_field_definitions(entity_type);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_id, entity_type);
CREATE INDEX idx_custom_field_values_def ON custom_field_values(field_definition_id);
