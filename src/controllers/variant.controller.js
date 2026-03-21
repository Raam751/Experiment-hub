const variantService = require('../services/variant.service');

async function create(req, res) {
    const experimentId = req.params.id;
    const { name, weight, is_control } = req.body;

    if (!name || weight === undefined) {
        return res.status(400).json({ error: 'Name and weight are required' });
    }

    if (weight < 0 || weight > 100) {
        return res.status(400).json({ error: 'Weight must be between 0 and 100' });
    }

    const variant = await variantService.create(experimentId, name, weight, is_control);
    res.status(201).json(variant);
}

async function findByExperimentId(req, res) {
    const variants = await variantService.findByExperimentId(req.params.id);
    res.json(variants);
}

async function update(req, res) {
    const { name, weight, is_control } = req.body;
    const variant = await variantService.update(req.params.variantId, {
        name,
        weight,
        isControl: is_control
    });
    res.json(variant);
}

async function remove(req, res) {
    await variantService.remove(req.params.variantId);
    res.status(204).send();
}

module.exports = {
    create,
    findByExperimentId,
    update,
    remove
};
