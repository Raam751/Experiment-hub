const db = require('../configs/db');

/**
 * Insert a single event.
 */
async function createOne(experimentId, variantId, userId, type) {
    const result = await db.query(
        `INSERT INTO events (experiment_id, variant_id, user_id, type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [experimentId, variantId, userId, type]
    );
    return result.rows[0];
}

/**
 * Batch insert multiple events in a single query.
 * 
 * Instead of N separate INSERT statements (N round trips to DB),
 * we build one INSERT with N value tuples (1 round trip).
 * 
 * Example for 3 events:
 * INSERT INTO events (...) VALUES ($1,$2,$3,$4), ($5,$6,$7,$8), ($9,$10,$11,$12)
 */
async function createBatch(events) {
    if (events.length === 0) return [];

    const values = [];
    const params = [];

    events.forEach((event, index) => {
        const offset = index * 4;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
        params.push(event.experiment_id, event.variant_id, event.user_id, event.type);
    });

    const query = `
        INSERT INTO events (experiment_id, variant_id, user_id, type)
        VALUES ${values.join(', ')}
        RETURNING *
    `;

    const result = await db.query(query, params);
    return result.rows;
}

module.exports = {
    createOne,
    createBatch
};
