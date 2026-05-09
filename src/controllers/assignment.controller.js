const assignmentService = require('../services/assignment.service');

async function previewAssignment(req, res) {
    const experimentId = req.params.id;
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id query parameter is required' });
    }

    const assignment = await assignmentService.assignUser(experimentId, user_id);
    res.json(assignment);
}

module.exports = { previewAssignment };
