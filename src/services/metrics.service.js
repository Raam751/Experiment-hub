const metricsRepository = require('../repositories/metrics.repository');
const experimentService = require('../services/experiment.service');

/**
 * Force a re-computation of metrics from raw events, then return the results.
 */
async function computeAndGetMetrics(experimentId) {
    // 1. Verify experiment exists (throws 404 if not found)
    await experimentService.findById(experimentId);
    
    // 2. Compute metrics (aggregates events and upserts `metrics` table)
    await metricsRepository.computeMetrics(experimentId);
    
    // 3. Return the formatted results
    return await metricsRepository.getMetrics(experimentId);
}

/**
 * Get metrics without re-computing (returns latest computed snapshot).
 */
async function getLatestMetrics(experimentId) {
    // 1. Verify experiment exists
    await experimentService.findById(experimentId);
    
    // 2. Return latest snapshot
    return await metricsRepository.getMetrics(experimentId);
}

module.exports = {
    computeAndGetMetrics,
    getLatestMetrics
};
