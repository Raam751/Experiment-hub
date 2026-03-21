const assignmentService = require('../services/assignment.service');
const eventService = require('../services/event.service');

async function assign(req, res) {
    const experimentId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    const assignment = await assignmentService.assignUser(experimentId, user_id);
    res.json(assignment);
}

async function logEvents(req, res) {
    const result = await eventService.logEvents(req.body);
    res.status(201).json(result);
}

module.exports = {
    assign,
    logEvents
};
