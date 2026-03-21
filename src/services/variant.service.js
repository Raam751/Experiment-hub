const variantRepository = require('../repositories/variant.repository');
const experimentService = require('../services/experiment.service');
const cacheService = require('./cache.service');

// Helper: ensure experiment exists and is in draft status
async function ensureDraftExperiment(experimentId) {
    const experiment = await experimentService.findById(experimentId); // throws 404
    if (experiment.status !== 'draft') {
        const error = new Error('Variants can only be modified on draft experiments');
        error.status = 400;
        throw error;
    }
    return experiment;
}

async function create(experimentId, name, weight, isControl) {
    await ensureDraftExperiment(experimentId);

    // Validate that adding this weight won't exceed 100
    const currentTotal = await variantRepository.getSumOfWeights(experimentId);
    if (currentTotal + weight > 100) {
        const error = new Error(
            `Weight ${weight} would make total ${currentTotal + weight}. ` +
            `Current total is ${currentTotal}, max remaining is ${100 - currentTotal}.`
        );
        error.status = 400;
        throw error;
    }

    const variant = await variantRepository.create(experimentId, name, weight, isControl);
    await cacheService.invalidate(experimentId);
    return variant;
}

async function findByExperimentId(experimentId) {
    // Verify experiment exists (throws 404 if not)
    await experimentService.findById(experimentId);
    return await variantRepository.findByExperimentId(experimentId);
}

async function findById(id) {
    const variant = await variantRepository.findById(id);
    if (!variant) {
        const error = new Error('Variant not found');
        error.status = 404;
        throw error;
    }
    return variant;
}

async function update(id, updates) {
    const variant = await findById(id); // throws 404
    await ensureDraftExperiment(variant.experiment_id);

    // If weight is being updated, validate the new total
    if (updates.weight !== undefined) {
        const otherWeightsTotal = await variantRepository.getSumOfWeights(
            variant.experiment_id,
            id // exclude this variant from the sum
        );
        if (otherWeightsTotal + updates.weight > 100) {
            const error = new Error(
                `Weight ${updates.weight} would make total ${otherWeightsTotal + updates.weight}. ` +
                `Other variants total ${otherWeightsTotal}, max allowed is ${100 - otherWeightsTotal}.`
            );
            error.status = 400;
            throw error;
        }
    }

    const updated = await variantRepository.update(id, updates);
    await cacheService.invalidate(variant.experiment_id);
    return updated;
}

async function remove(id) {
    const variant = await findById(id); // throws 404
    await ensureDraftExperiment(variant.experiment_id);
    await cacheService.invalidate(variant.experiment_id);
    return await variantRepository.remove(id);
}

module.exports = {
    create,
    findByExperimentId,
    findById,
    update,
    remove
};
