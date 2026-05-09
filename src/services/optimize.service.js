const metricsService = require('./metrics.service');

// Node 18 natively supports global fetch()

async function triggerOptimization(experimentId) {
    // 1. Get the absolute latest, freshly computed metrics
    const metrics = await metricsService.computeAndGetMetrics(experimentId);
    
    if (metrics.length === 0) {
        const error = new Error('No event data found. Simulate traffic first to generate exposure and conversion data before optimizing.');
        error.status = 400;
        throw error;
    }

    if (metrics.length < 2) {
        const error = new Error('Need event data for at least 2 variants to optimize. Make sure all variants have received traffic.');
        error.status = 400;
        throw error;
    }

    // 2. Format the payload for the Python service
    const payload = {
        experiment_id: parseInt(experimentId),
        variants: metrics.map(m => ({
            variant_id: m.variant_id,
            exposures: parseInt(m.exposures),
            conversions: parseInt(m.conversions)
        }))
    };

    // 3. Make HTTP call to the Python microservice
    const banditUrl = process.env.BANDIT_SERVICE_URL || 'http://localhost:8000';
    const banditApiKey = process.env.BANDIT_API_KEY || 'internal-service-key';

    try {
        const response = await fetch(`${banditUrl}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': banditApiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Python service responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data; // returns the updated weights payload from Python
    } catch (err) {
        const logger = require('../configs/logger');
        logger.error({ err, banditUrl: `${banditUrl}/optimize` }, 'Failed to trigger optimization');
        const error = new Error(`Failed to communicate with the Optimization Bandit Service: ${err.message}`);
        error.status = 502; // Bad Gateway
        throw error;
    }
}

module.exports = {
    triggerOptimization
};
