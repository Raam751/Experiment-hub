-- 005: Pre-aggregated metrics table
-- Stores computed metrics per variant to avoid expensive COUNT queries on events.
-- Updated periodically or on-demand when GET /experiments/:id/metrics is called.

CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    exposures BIGINT NOT NULL DEFAULT 0,
    conversions BIGINT NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(7, 4) DEFAULT 0.0,
    last_computed_at TIMESTAMPTZ,

    -- One metrics row per variant
    UNIQUE(experiment_id, variant_id)
);
