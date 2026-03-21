const internalService = require('../services/internal.service');

async function updateWeights(req, res) {
    const experimentId = req.params.id;
    const { weights } = req.body; // Expects { "variantId": weight, ... }

    if (!weights || typeof weights !== 'object') {
        return res.status(400).json({ error: 'weights object is required' });
    }

    const result = await internalService.updateVariantWeights(experimentId, weights);
    res.json(result);
}

module.exports = {
    updateWeights
};
