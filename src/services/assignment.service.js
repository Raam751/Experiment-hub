const crypto = require('crypto');
const experimentService = require('./experiment.service');
const variantRepository = require('../repositories/variant.repository');
const cacheService = require('./cache.service');

/**
 * Deterministic user-to-variant assignment using consistent hashing.
 * 
 * How it works:
 * 1. Hash (experimentId + userId) with SHA-256
 * 2. Take first 8 hex chars → convert to a number (0 to 4,294,967,295)
 * 3. Modulo 100 → get a bucket (0-99)
 * 4. Walk through variants' weight ranges to find which variant owns that bucket
 * 
 * Example with 3 variants (weights: 50, 30, 20):
 *   Buckets 0-49  → variant A (weight 50)
 *   Buckets 50-79 → variant B (weight 30)
 *   Buckets 80-99 → variant C (weight 20)
 * 
 * This is deterministic: same user + same experiment = same variant, always.
 * No database writes needed for assignment.
 */
function hashToBucket(experimentId, userId) {
    const hash = crypto
        .createHash('sha256')
        .update(`${experimentId}:${userId}`)
        .digest('hex');

    // Take first 8 hex characters (32 bits of entropy — more than enough)
    const numericHash = parseInt(hash.substring(0, 8), 16);
    return numericHash % 100;
}

function assignBucketToVariant(bucket, variants) {
    let cumulativeWeight = 0;
    for (const variant of variants) {
        cumulativeWeight += variant.weight;
        if (bucket < cumulativeWeight) {
            return variant;
        }
    }
    // Fallback: return last variant (should not reach here if weights sum to 100)
    return variants[variants.length - 1];
}

/**
 * Assign a user to a variant for a given experiment.
 * Uses cache-aside pattern: check cache first, fall back to DB on miss.
 */
async function assignUser(experimentId, userId) {
    // 1. Check cache for experiment config
    let config = await cacheService.getExperimentConfig(experimentId);

    if (!config) {
        // 2. Cache miss — load from DB
        const experiment = await experimentService.findById(experimentId);

        if (experiment.status !== 'running') {
            const error = new Error('Assignment only works for running experiments');
            error.status = 400;
            throw error;
        }

        const variants = await variantRepository.findByExperimentId(experimentId);
        if (variants.length === 0) {
            const error = new Error('Experiment has no variants');
            error.status = 400;
            throw error;
        }

        config = { experiment, variants };

        // 3. Populate cache for next request
        await cacheService.setExperimentConfig(experimentId, config);
    }

    // 4. Deterministic assignment
    const bucket = hashToBucket(experimentId, userId);
    const assignedVariant = assignBucketToVariant(bucket, config.variants);

    return {
        experimentId: config.experiment.id,
        experimentName: config.experiment.name,
        userId,
        variant: {
            id: assignedVariant.id,
            name: assignedVariant.name,
            is_control: assignedVariant.is_control
        },
        bucket // include for debugging/transparency
    };
}

module.exports = {
    assignUser,
    hashToBucket,           // exported for testing
    assignBucketToVariant   // exported for testing
};
