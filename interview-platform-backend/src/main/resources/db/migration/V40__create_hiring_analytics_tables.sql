-- V40: Hiring Funnel Analytics
-- Pre-computed analytics tables for fast dashboard queries.
-- Updated by a scheduled job that processes pipeline events.

CREATE TABLE hiring_funnel_metrics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID,
    pipeline_id         UUID,
    pipeline_name       VARCHAR(200),
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    period_type         VARCHAR(10) NOT NULL,   -- DAILY, WEEKLY, MONTHLY
    -- Stage counts
    total_candidates    INTEGER DEFAULT 0,
    stage_screening     INTEGER DEFAULT 0,
    stage_technical     INTEGER DEFAULT 0,
    stage_hr            INTEGER DEFAULT 0,
    stage_final         INTEGER DEFAULT 0,
    stage_offer         INTEGER DEFAULT 0,
    -- Outcomes
    total_hired         INTEGER DEFAULT 0,
    total_rejected      INTEGER DEFAULT 0,
    total_withdrawn     INTEGER DEFAULT 0,
    -- Conversion rates (percentage 0-100)
    screening_to_technical  DECIMAL(5,2),
    technical_to_hr         DECIMAL(5,2),
    hr_to_final             DECIMAL(5,2),
    final_to_offer          DECIMAL(5,2),
    offer_to_hired          DECIMAL(5,2),
    overall_conversion      DECIMAL(5,2),
    -- Time metrics (in hours)
    avg_time_to_hire        DECIMAL(10,2),
    avg_time_in_screening   DECIMAL(10,2),
    avg_time_in_technical   DECIMAL(10,2),
    avg_time_in_hr          DECIMAL(10,2),
    avg_time_in_final       DECIMAL(10,2),
    -- Source effectiveness
    top_source              VARCHAR(100),
    top_source_count        INTEGER,
    computed_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE stage_dropout_analysis (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID,
    pipeline_id         UUID,
    stage_name          VARCHAR(100) NOT NULL,
    stage_order         INTEGER NOT NULL,
    candidates_entered  INTEGER DEFAULT 0,
    candidates_passed   INTEGER DEFAULT 0,
    candidates_rejected INTEGER DEFAULT 0,
    candidates_withdrew INTEGER DEFAULT 0,
    avg_days_in_stage   DECIMAL(10,2),
    dropout_rate        DECIMAL(5,2),          -- percentage
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    computed_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funnel_metrics_org ON hiring_funnel_metrics(organization_id);
CREATE INDEX idx_funnel_metrics_period ON hiring_funnel_metrics(period_start, period_end);
CREATE INDEX idx_funnel_metrics_pipeline ON hiring_funnel_metrics(pipeline_id);
CREATE INDEX idx_dropout_pipeline ON stage_dropout_analysis(pipeline_id);
CREATE INDEX idx_dropout_period ON stage_dropout_analysis(period_start, period_end);
