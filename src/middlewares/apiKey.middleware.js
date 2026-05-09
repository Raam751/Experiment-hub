const crypto = require('crypto');

function timingSafeCompare(a, b) {
    if (!a || !b) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function requireApiKey(req, res, next) {
    const apiKey = req.header('X-API-Key');
    const validKey = process.env.BANDIT_API_KEY;

    if (!timingSafeCompare(apiKey, validKey)) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing API Key' });
    }

    next();
}

function requireRuntimeApiKey(req, res, next) {
    const apiKey = req.header('X-API-Key') || req.query.api_key;
    const validKey = process.env.RUNTIME_API_KEY;

    if (!validKey) return next();

    if (!timingSafeCompare(apiKey, validKey)) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing Runtime API Key' });
    }

    next();
}

module.exports = {
    requireApiKey,
    requireRuntimeApiKey
};
