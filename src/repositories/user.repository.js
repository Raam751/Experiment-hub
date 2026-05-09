const db = require('../configs/db');


async function createUser(email, passwordHash, role) {
    const result = await db.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
        [email, passwordHash, role]
    );
    return result.rows[0];
}


async function findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

async function findById(id) {
    const result = await db.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
}

async function updateRole(id, role) {
    const result = await db.query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, role, created_at',
        [role, id]
    );
    return result.rows[0];
}

module.exports = {
    createUser,
    findByEmail,
    findById,
    updateRole
}