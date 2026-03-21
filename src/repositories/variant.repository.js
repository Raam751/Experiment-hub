const db = require('../configs/db');

async function create(experimentId, name, weight, isControl = false) {
    const result = await db.query(
        `INSERT INTO variants (experiment_id, name, weight, is_control)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [experimentId, name, weight, isControl]
    );
    return result.rows[0];
}

async function findByExperimentId(experimentId) {
    const result = await db.query(
        'SELECT * FROM variants WHERE experiment_id = $1 ORDER BY created_at',
        [experimentId]
    );
    return result.rows;
}

async function findById(id) {
    const result = await db.query('SELECT * FROM variants WHERE id = $1', [id]);
    return result.rows[0];
}

async function update(id, { name, weight, isControl }) {
    const result = await db.query(
        `UPDATE variants
         SET name = COALESCE($1, name),
             weight = COALESCE($2, weight),
             is_control = COALESCE($3, is_control),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [name, weight, isControl, id]
    );
    return result.rows[0];
}

async function remove(id) {
    const result = await db.query(
        'DELETE FROM variants WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
}

// Get total weight of all OTHER variants for an experiment (excluding one variant)
async function getSumOfWeights(experimentId, excludeVariantId = null) {
    let query = 'SELECT COALESCE(SUM(weight), 0) as total_weight FROM variants WHERE experiment_id = $1';
    const params = [experimentId];

    if (excludeVariantId) {
        params.push(excludeVariantId);
        query += ` AND id != $${params.length}`;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].total_weight);
}

module.exports = {
    create,
    findByExperimentId,
    findById,
    update,
    remove,
    getSumOfWeights
};
