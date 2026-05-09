require('dotenv').config();
const app = require('./app');
const logger = require('./configs/logger');
const { pool } = require('./configs/db');
const redis = require('./configs/redis');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

function gracefulShutdown(signal) {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        logger.info('HTTP server closed');
        try {
            await pool.end();
            logger.info('PostgreSQL pool drained');
        } catch (err) {
            logger.error({ err }, 'Error closing PostgreSQL pool');
        }
        try {
            if (redis) await redis.quit();
            logger.info('Redis connection closed');
        } catch (err) {
            logger.error({ err }, 'Error closing Redis');
        }
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
