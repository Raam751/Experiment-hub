const metricsService = require('../services/metrics.service');

async function getMetrics(req, res) {
    const experimentId = req.params.id;
    const { compute } = req.query;

    // If '?compute=true' is passed, force real-time recomputation from raw events
    if (compute === 'true') {
        const metrics = await metricsService.computeAndGetMetrics(experimentId);
        return res.json({
            message: 'Metrics re-computed successfully',
            data: metrics
        });
    }

    // Otherwise, return the latest pre-computed snapshot
    const metrics = await metricsService.getLatestMetrics(experimentId);
    res.json({
        data: metrics
    });
}

module.exports = {
    getMetrics
};
