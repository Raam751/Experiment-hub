const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock the user repository before requiring the service
jest.mock('../repositories/user.repository');
const userRepository = require('../repositories/user.repository');

// Set env vars for JWT
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRY = '1h';

const authService = require('../services/auth.service');

describe('Auth Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        test('rejects duplicate email', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'taken@test.com' });

            await expect(authService.register('taken@test.com', 'Password1'))
                .rejects.toThrow('Email already exists');
        });

        test('rejects weak password (too short)', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.register('new@test.com', 'Ab1'))
                .rejects.toThrow('Password must be at least 8 characters');
        });

        test('rejects password with no number', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.register('new@test.com', 'Abcdefgh'))
                .rejects.toThrow('Password must be at least 8 characters');
        });

        test('rejects password with no letter', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.register('new@test.com', '12345678'))
                .rejects.toThrow('Password must be at least 8 characters');
        });

        test('successfully registers with valid input', async () => {
            userRepository.findByEmail.mockResolvedValue(null);
            userRepository.createUser.mockResolvedValue({
                id: 1, email: 'new@test.com', role: 'viewer'
            });

            const user = await authService.register('new@test.com', 'ValidPass1');

            expect(userRepository.createUser).toHaveBeenCalledWith(
                'new@test.com',
                expect.any(String), // hashed password
                'viewer'            // always viewer, never admin
            );
            expect(user.role).toBe('viewer');
        });

        test('always registers as viewer role', async () => {
            userRepository.findByEmail.mockResolvedValue(null);
            userRepository.createUser.mockResolvedValue({
                id: 1, email: 'new@test.com', role: 'viewer'
            });

            await authService.register('new@test.com', 'ValidPass1');

            const callArgs = userRepository.createUser.mock.calls[0];
            expect(callArgs[2]).toBe('viewer');
        });
    });

    describe('login', () => {
        test('rejects non-existent user', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            await expect(authService.login('nope@test.com', 'password'))
                .rejects.toThrow('Invalid email or password');
        });

        test('rejects wrong password', async () => {
            const hash = await bcrypt.hash('correct', 10);
            userRepository.findByEmail.mockResolvedValue({
                id: 1, email: 'user@test.com', password_hash: hash, role: 'viewer'
            });

            await expect(authService.login('user@test.com', 'wrong'))
                .rejects.toThrow('Invalid email or password');
        });

        test('returns JWT token on success', async () => {
            const hash = await bcrypt.hash('correct', 10);
            userRepository.findByEmail.mockResolvedValue({
                id: 1, email: 'user@test.com', password_hash: hash, role: 'admin'
            });

            const result = await authService.login('user@test.com', 'correct');

            expect(result.token).toBeDefined();
            expect(result.user.email).toBe('user@test.com');
            expect(result.user.role).toBe('admin');

            const decoded = jwt.verify(result.token, process.env.JWT_SECRET);
            expect(decoded.id).toBe(1);
            expect(decoded.email).toBe('user@test.com');
        });
    });
});
