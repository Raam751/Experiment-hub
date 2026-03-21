const experimentService = require('../services/experiment.service');

async function create(req, res) {
    const { name, description } = req.body;
    const createdBy = req.user.id; // from auth middleware

    const experiment = await experimentService.create(name, description, createdBy);
    res.status(201).json(experiment);
}

async function findAll(req, res) {
    const { status, limit, offset } = req.query;

    const experiments = await experimentService.findAll({
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
    });

    res.json(experiments);
}

async function findById(req, res) {
    const experiment = await experimentService.findById(req.params.id);
    res.json(experiment);
}

async function updateMetadata(req, res) {
    const { name, description } = req.body;
    const experiment = await experimentService.updateMetadata(req.params.id, { name, description });
    res.json(experiment);
}

async function updateStatus(req, res) {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const experiment = await experimentService.updateStatus(req.params.id, status);
    res.json(experiment);
}

async function remove(req, res) {
    await experimentService.remove(req.params.id);
    res.status(204).send();
}

module.exports = {
    create,
    findAll,
    findById,
    updateMetadata,
    updateStatus,
    remove
};
