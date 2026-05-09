const assignmentService = require('./assignment.service');
const eventRepository = require('../repositories/event.repository');
const metricsRepository = require('../repositories/metrics.repository');
const experimentService = require('./experiment.service');

async function simulateTraffic(experimentId, userCount, conversionRates = {}) {
    const experiment = await experimentService.findById(experimentId);
    if (experiment.status !== 'running') {
        const error = new Error('Can only simulate traffic for running experiments');
        error.status = 400;
        throw error;
    }

    const events = [];
    const stats = {};

    for (let i = 0; i < userCount; i++) {
        const userId = `sim_${Date.now()}_${i}`;
        const assignment = await assignmentService.assignUser(experimentId, userId);
        const variantId = assignment.variant.id;

        if (!stats[variantId]) {
            stats[variantId] = { name: assignment.variant.name, exposures: 0, conversions: 0 };
        }

        events.push({
            experiment_id: experimentId,
            variant_id: variantId,
            user_id: userId,
            type: 'exposure'
        });
        stats[variantId].exposures++;

        const rate = conversionRates[variantId] !== undefined
            ? conversionRates[variantId]
            : Math.random() * 0.3;

        if (Math.random() < rate) {
            events.push({
                experiment_id: experimentId,
                variant_id: variantId,
                user_id: userId,
                type: 'conversion'
            });
            stats[variantId].conversions++;
        }
    }

    const BATCH_SIZE = 500;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
        const batch = events.slice(i, i + BATCH_SIZE);
        await eventRepository.createBatch(batch);
    }

    await metricsRepository.computeMetrics(experimentId);

    return {
        usersSimulated: userCount,
        eventsGenerated: events.length,
        perVariant: stats
    };
}

module.exports = { simulateTraffic };
