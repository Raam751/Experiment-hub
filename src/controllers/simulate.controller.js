const simulateService = require('../services/simulate.service');

async function simulate(req, res) {
    const experimentId = req.params.id;
    const { userCount = 200, conversionRates = {} } = req.body;

    if (userCount < 1 || userCount > 10000) {
        return res.status(400).json({ error: 'userCount must be between 1 and 10000' });
    }

    const result = await simulateService.simulateTraffic(
        experimentId,
        userCount,
        conversionRates
    );

    res.json({
        message: `Simulated ${result.usersSimulated} users`,
        data: result
    });
}

module.exports = { simulate };
