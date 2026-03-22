const Redis = require('ioredis');

let redis = null;

// Only connect to Redis if REDIS_URL is provided
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            if (times > 3) {
                console.warn('Redis unavailable after 3 retries — running without cache');
                return null; // stop retrying
            }
            return Math.min(times * 50, 2000);
        }
    });

    redis.on('connect', () => {
        console.log('Connected to Redis');
    });

    redis.on('error', (err) => {
        console.error('Redis error:', err.message);
    });
} else {
    console.log('REDIS_URL not set — running without cache (all reads go to DB)');
}

module.exports = redis;
