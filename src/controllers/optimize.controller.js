const optimizeService = require('../services/optimize.service');

async function triggerOptimization(req, res) {
    const experimentId = req.params.id;
    const result = await optimizeService.triggerOptimization(experimentId);
    res.json({
        message: 'Optimization ran successfully',
        data: result
    });
}

module.exports = {
    triggerOptimization
};
