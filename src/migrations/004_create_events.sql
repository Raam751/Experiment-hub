-- 004: Events table (append-only event log)
-- Stores exposure and conversion events.
-- Uses BIGSERIAL because this table will grow fast.
-- user_id is a VARCHAR (external user identifier, not a FK to our users table).

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    experiment_id INTEGER NOT NULL REFERENCES experiments(id),
    variant_id INTEGER NOT NULL REFERENCES variants(id),
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('exposure', 'conversion')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for metrics aggregation queries:
-- "Count exposures/conversions per variant for experiment X"
CREATE INDEX IF NOT EXISTS idx_events_experiment_type ON events(experiment_id, type);

-- Index for deduplication checks:
-- "Has user Y already been exposed to experiment X?"
CREATE INDEX IF NOT EXISTS idx_events_experiment_user ON events(experiment_id, user_id);

-- Index for date-range filtered queries
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
