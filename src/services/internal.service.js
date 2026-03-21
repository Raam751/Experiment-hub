const db = require('../configs/db');
const cacheService = require('./cache.service');
const experimentService = require('./experiment.service');

/**
 * Updates weights for multiple variants in a single transaction.
 * Bypasses the "draft-only" restriction because this is called by the bandit
 * service to optimize running experiments.
 * 
 * weightsDict: { "variantId1": newWeight1, "variantId2": newWeight2 }
 */
async function updateVariantWeights(experimentId, weightsDict) {
    // 1. Verify experiment exists and is running
    const experiment = await experimentService.findById(experimentId);
    if (experiment.status !== 'running') {
        const error = new Error('Can only optimize weights for running experiments');
        error.status = 400;
        throw error;
    }

    // 2. Validate weights sum to 100
    const totalWeight = Object.values(weightsDict).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight !== 100) {
        const error = new Error(`Weights must sum to 100, got ${totalWeight}`);
        error.status = 400;
        throw error;
    }

    // 3. Update all weights inside a Postgres transaction
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const [variantId, weight] of Object.entries(weightsDict)) {
            // Check that variant actually belongs to this experiment
            const check = await client.query(
                'SELECT id FROM variants WHERE id = $1 AND experiment_id = $2', 
                [variantId, experimentId]
            );
            if (check.rowCount === 0) {
                throw new Error(`Variant ${variantId} does not belong to experiment ${experimentId}`);
            }

            await client.query(
                'UPDATE variants SET weight = $1, updated_at = NOW() WHERE id = $2',
                [weight, variantId]
            );
        }
        
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Transaction failed during weight update', e);
        const error = new Error(e.message || 'Failed to update weights');
        error.status = 400;
        throw error;
    } finally {
        client.release();
    }

    // 4. Invalidate the cache for this experiment so the next assignment 
    // uses the newly optimized weights
    await cacheService.invalidate(experimentId);

    return { message: 'Weights optimized successfully' };
}

module.exports = {
    updateVariantWeights
};
