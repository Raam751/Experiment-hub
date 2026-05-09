const Redis = require('ioredis');
const logger = require('./logger');

let redis = null;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                logger.warn('Redis unavailable after 3 retries — running without cache');
                return null;
            }
            return Math.min(times * 50, 2000);
        }
    });

    redis.on('connect', () => {
        logger.info('Connected to Redis');
    });

    redis.on('error', (err) => {
        logger.error({ err: err.message }, 'Redis error');
    });
} else {
    logger.info('REDIS_URL not set — running without cache');
}

module.exports = redis;
