const redis = require('../configs/redis');
const logger = require('../configs/logger');

const CACHE_PREFIX = 'exp:';
const CACHE_TTL = 300;

async function getExperimentConfig(experimentId) {
    if (!redis) return null;
    try {
        const cached = await redis.get(`${CACHE_PREFIX}${experimentId}`);
        if (!cached) return null;
        return JSON.parse(cached);
    } catch (err) {
        logger.error({ err: err.message, experimentId }, 'Cache read error');
        return null;
    }
}

async function setExperimentConfig(experimentId, config) {
    if (!redis) return;
    try {
        await redis.set(
            `${CACHE_PREFIX}${experimentId}`,
            JSON.stringify(config),
            'EX',
            CACHE_TTL
        );
    } catch (err) {
        logger.error({ err: err.message, experimentId }, 'Cache write error');
    }
}

async function invalidate(experimentId) {
    if (!redis) return;
    try {
        await redis.del(`${CACHE_PREFIX}${experimentId}`);
    } catch (err) {
        logger.error({ err: err.message, experimentId }, 'Cache invalidation error');
    }
}

module.exports = {
    getExperimentConfig,
    setExperimentConfig,
    invalidate
};
