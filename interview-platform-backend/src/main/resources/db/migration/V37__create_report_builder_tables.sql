-- V37: Custom Report Builder - Templates, Schedules, Generated Reports

CREATE TABLE report_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    entity_type         VARCHAR(50) NOT NULL,  -- INTERVIEW, CANDIDATE, PIPELINE, FEEDBACK, USER
    columns             JSONB NOT NULL,         -- [{field, label, type, sortable}]
    filters             JSONB,                  -- [{field, operator, value}]
    group_by            VARCHAR(100),
    sort_by             VARCHAR(100),
    sort_direction      VARCHAR(4) DEFAULT 'DESC',
    aggregations        JSONB,                  -- [{field, function}] (COUNT, SUM, AVG, MIN, MAX)
    chart_type          VARCHAR(30),            -- TABLE, BAR, LINE, PIE, FUNNEL
    is_public           BOOLEAN DEFAULT FALSE,
    created_by          UUID NOT NULL REFERENCES users(id),
    organization_id     UUID,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE
);

CREATE TABLE report_schedules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    cron_expression     VARCHAR(100) NOT NULL,   -- e.g., "0 9 * * MON" (every Monday at 9am)
    format              VARCHAR(10) NOT NULL DEFAULT 'PDF',  -- PDF, EXCEL, CSV
    recipients          TEXT[] NOT NULL,          -- email addresses
    enabled             BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at         TIMESTAMP WITH TIME ZONE,
    next_run_at         TIMESTAMP WITH TIME ZONE,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE generated_reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    schedule_id         UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
    name                VARCHAR(300) NOT NULL,
    format              VARCHAR(10) NOT NULL,
    s3_key              VARCHAR(1000),
    file_size_bytes     BIGINT,
    row_count           INTEGER,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, GENERATING, COMPLETED, FAILED
    error_message       TEXT,
    generated_by        UUID NOT NULL REFERENCES users(id),
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_report_templates_entity_type ON report_templates(entity_type);
CREATE INDEX idx_report_schedules_template ON report_schedules(template_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE enabled = TRUE;
CREATE INDEX idx_generated_reports_template ON generated_reports(template_id);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);
