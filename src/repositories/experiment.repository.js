const db = require('../configs/db');

async function create(name, description, createdBy) {
    const result = await db.query(
        `INSERT INTO experiments (name, description, created_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, description, createdBy]
    );
    return result.rows[0];
}

async function findAll({ status, limit = 20, offset = 0 }) {
    let query = 'SELECT * FROM experiments';
    const params = [];

    // Optional status filter
    if (status) {
        params.push(status);
        query += ` WHERE status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    // Pagination
    params.push(limit);
    query += ` LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);
    return result.rows;
}

async function findById(id) {
    const result = await db.query('SELECT * FROM experiments WHERE id = $1', [id]);
    return result.rows[0];
}

async function updateMetadata(id, { name, description }) {
    const result = await db.query(
        `UPDATE experiments
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [name, description, id]
    );
    return result.rows[0];
}

async function updateStatus(id, status) {
    const result = await db.query(
        `UPDATE experiments
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, id]
    );
    return result.rows[0];
}

async function remove(id) {
    const result = await db.query(
        'DELETE FROM experiments WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0];
}

module.exports = {
    create,
    findAll,
    findById,
    updateMetadata,
    updateStatus,
    remove
};
