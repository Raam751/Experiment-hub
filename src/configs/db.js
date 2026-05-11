const { Pool } = require('pg');
const logger = require('./logger');

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const needsSSL = !isLocal && dbUrl.length > 0;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: needsSSL ? { rejectUnauthorized: false } : false,
    max: needsSSL ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
    logger.info('Connected to PostgreSQL');
});

pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};

