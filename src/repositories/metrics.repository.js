const db = require('../configs/db');

/**
 * Aggregates metrics from the raw `events` table and upserts them into `metrics`.
 * This query computes exposures, conversions, and conversion_rate per variant.
 * 
 * Performance note: This query does a full table scan on `events` for the given experiment_id.
 * The composite index `idx_events_experiment_type` speeds this up.
 */
async function computeMetrics(experimentId) {
    const query = `
        INSERT INTO metrics (experiment_id, variant_id, exposures, conversions, conversion_rate, last_computed_at)
        SELECT 
            e.experiment_id,
            e.variant_id,
            COUNT(e.id) FILTER (WHERE e.type = 'exposure') AS exposures,
            COUNT(e.id) FILTER (WHERE e.type = 'conversion') AS conversions,
            CASE 
                WHEN COUNT(e.id) FILTER (WHERE e.type = 'exposure') = 0 THEN 0.0
                ELSE CAST(COUNT(e.id) FILTER (WHERE e.type = 'conversion') AS DECIMAL) / 
                     COUNT(e.id) FILTER (WHERE e.type = 'exposure')
            END AS conversion_rate,
            NOW() as last_computed_at
        FROM events e
        WHERE e.experiment_id = $1
        GROUP BY e.experiment_id, e.variant_id
        ON CONFLICT (experiment_id, variant_id) 
        DO UPDATE SET 
            exposures = EXCLUDED.exposures,
            conversions = EXCLUDED.conversions,
            conversion_rate = EXCLUDED.conversion_rate,
            last_computed_at = EXCLUDED.last_computed_at
        RETURNING *;
    `;

    const result = await db.query(query, [experimentId]);
    return result.rows;
}

/**
 * Retrieves the latest pre-computed metrics for an experiment.
 * Joins with variants to include variant names.
 */
async function getMetrics(experimentId) {
    const query = `
        SELECT 
            m.variant_id,
            v.name as variant_name,
            v.is_control,
            m.exposures,
            m.conversions,
            m.conversion_rate,
            m.last_computed_at
        FROM metrics m
        JOIN variants v ON m.variant_id = v.id
        WHERE m.experiment_id = $1
        ORDER BY v.created_at;
    `;
    const result = await db.query(query, [experimentId]);
    return result.rows;
}

module.exports = {
    computeMetrics,
    getMetrics
};
