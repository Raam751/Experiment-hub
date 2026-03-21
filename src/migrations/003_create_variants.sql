-- 003: Variants table
-- Each experiment has multiple variants. Weights must sum to 100 across an experiment.
-- Weight validation is enforced in the service layer (cross-row constraint).

CREATE TABLE IF NOT EXISTS variants (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight INTEGER NOT NULL DEFAULT 0
        CHECK (weight >= 0 AND weight <= 100),
    is_control BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A variant name must be unique within an experiment
    UNIQUE(experiment_id, name)
);

-- Index for looking up all variants of an experiment
CREATE INDEX IF NOT EXISTS idx_variants_experiment_id ON variants(experiment_id);