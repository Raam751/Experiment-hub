const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

async function register(email, password, role = 'viewer') {
    // 1. Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        const error = new Error('Email already exists');
        error.status = 409; // Conflict
        throw error;
    }

    // 2. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Create user
    return await userRepository.createUser(email, passwordHash, role);
}

async function login(email, password) {
    // 1. Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
        const error = new Error('Invalid email or password');
        error.status = 401; // Unauthorized
        throw error;
    }

    // 2. Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        const error = new Error('Invalid email or password');
        error.status = 401; // Unauthorized
        throw error;
    }

    // 3. Generate JWT
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY }
    );

    return { user: payload, token };
}

module.exports = {
    register,
    login
};