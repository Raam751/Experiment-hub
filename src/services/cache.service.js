const redis = require('../configs/redis');

const CACHE_PREFIX = 'exp:';
const CACHE_TTL = 300; // 5 minutes

/**
 * Get experiment config (experiment + variants) from cache.
 * Returns null on cache miss or if Redis is unavailable.
 */
async function getExperimentConfig(experimentId) {
    if (!redis) return null;
    try {
        const cached = await redis.get(`${CACHE_PREFIX}${experimentId}`);
        if (!cached) return null;
        return JSON.parse(cached);
    } catch (err) {
        console.error('Cache read error:', err.message);
        return null;
    }
}

/**
 * Store experiment config in cache.
 */
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
        console.error('Cache write error:', err.message);
    }
}

/**
 * Invalidate cached config for an experiment.
 * Call this whenever experiment or its variants are updated.
 */
async function invalidate(experimentId) {
    if (!redis) return;
    try {
        await redis.del(`${CACHE_PREFIX}${experimentId}`);
    } catch (err) {
        console.error('Cache invalidation error:', err.message);
    }
}

module.exports = {
    getExperimentConfig,
    setExperimentConfig,
    invalidate
};
