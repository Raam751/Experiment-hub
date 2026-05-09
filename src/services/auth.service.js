const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

async function register(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const error = new Error('Invalid email format');
        error.status = 400;
        throw error;
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        const error = new Error('Email already exists');
        error.status = 409;
        throw error;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        const error = new Error('Password must be at least 8 characters with at least one letter and one number');
        error.status = 400;
        throw error;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    return await userRepository.createUser(email, passwordHash, 'viewer');
}

async function promoteUser(userId, role) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
    }

    return await userRepository.updateRole(userId, role);
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
    login,
    promoteUser
};