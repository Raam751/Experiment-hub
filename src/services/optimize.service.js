const metricsService = require('./metrics.service');

// Node 18 natively supports global fetch()

async function triggerOptimization(experimentId) {
    // 1. Get the absolute latest, freshly computed metrics
    const metrics = await metricsService.computeAndGetMetrics(experimentId);
    
    // We need at least 2 variants to run an A/B test optimization
    if (metrics.length < 2) {
        const error = new Error('Experiment needs at least 2 variants to optimize');
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
        console.error('Failed to trigger optimization:', err.message);
        console.error('Bandit URL was:', `${banditUrl}/optimize`);
        console.error('Full error:', err);
        const error = new Error(`Failed to communicate with the Optimization Bandit Service: ${err.message}`);
        error.status = 502; // Bad Gateway
        throw error;
    }
}

module.exports = {
    triggerOptimization
};
