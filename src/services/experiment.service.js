const experimentRepository = require('../repositories/experiment.repository');
const { canTransition, getAllowedTransitions } = require('../utils/stateMachine');
const cacheService = require('./cache.service');

async function create(name, description, createdBy) {
    if (!name) {
        const error = new Error('Experiment name is required');
        error.status = 400;
        throw error;
    }

    return await experimentRepository.create(name, description, createdBy);
}

async function findAll(filters) {
    return await experimentRepository.findAll(filters);
}

async function findById(id) {
    const experiment = await experimentRepository.findById(id);
    if (!experiment) {
        const error = new Error('Experiment not found');
        error.status = 404;
        throw error;
    }
    return experiment;
}

async function updateMetadata(id, updates) {
    // Only allow metadata updates on draft experiments
    const experiment = await findById(id); // throws 404 if not found

    if (experiment.status !== 'draft') {
        const error = new Error('Can only edit metadata of draft experiments');
        error.status = 400;
        throw error;
    }

    const updated = await experimentRepository.updateMetadata(id, updates);
    await cacheService.invalidate(id);
    return updated;
}

async function updateStatus(id, newStatus) {
    const experiment = await findById(id); // throws 404 if not found

    if (!canTransition(experiment.status, newStatus)) {
        const allowed = getAllowedTransitions(experiment.status);
        const error = new Error(
            `Cannot transition from '${experiment.status}' to '${newStatus}'. ` +
            `Allowed transitions: [${allowed.join(', ')}]`
        );
        error.status = 400;
        throw error;
    }

    const updated = await experimentRepository.updateStatus(id, newStatus);
    await cacheService.invalidate(id);
    return updated;
}

async function remove(id) {
    const experiment = await findById(id); // throws 404 if not found

    if (experiment.status !== 'draft') {
        const error = new Error('Can only delete draft experiments');
        error.status = 400;
        throw error;
    }

    await cacheService.invalidate(id);
    return await experimentRepository.remove(id);
}

module.exports = {
    create,
    findAll,
    findById,
    updateMetadata,
    updateStatus,
    remove
};
