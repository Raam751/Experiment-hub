const authService = require('../services/auth.service');

async function register(req, res) {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (role && !['admin', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be either admin or viewer' });
    }

    // Call service layer
    // (express-async-errors will catch any thrown errors and pass to the global error handler)
    const user = await authService.register(email, password, role);

    res.status(201).json({
        message: 'User registered successfully',
        user
    });
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);

    res.status(200).json({
        message: 'Login successful',
        ...result
    });
}

module.exports = {
    register,
    login
};
