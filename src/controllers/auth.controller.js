const authService = require('../services/auth.service');

async function register(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authService.register(email, password);

    res.status(201).json({
        message: 'User registered successfully',
        user
    });
}

async function promote(req, res) {
    const { userId, role } = req.body;

    if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
    }

    if (!['admin', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be either admin or viewer' });
    }

    const user = await authService.promoteUser(userId, role);
    res.json({ message: 'Role updated successfully', user });
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
    login,
    promote
};
