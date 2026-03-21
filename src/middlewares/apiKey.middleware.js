function requireApiKey(req, res, next) {
    const apiKey = req.header('X-API-Key');
    const validKey = process.env.BANDIT_API_KEY;

    if (!apiKey || apiKey !== validKey) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing API Key' });
    }

    next();
}

module.exports = {
    requireApiKey
};
