const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify token
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach user payload to request
        req.user = payload;

        // 4. Proceed to next middleware/route handler
        next();
    } catch (err) {
        // Token is invalid or expired
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = {
    authenticate
};
