/**
 * Middleware factory for role-based access control.
 * Must be used AFTER the authenticate middleware.
 * 
 * @param  {...string} allowedRoles List of roles allowed to access the route
 * @returns Express middleware function
 * 
 * Usage: router.post('/experiments', authenticate, authorize('admin'), controller.create)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        // Ensure authenticate middleware was called first
        if (!req.user) {
            return res.status(500).json({ error: 'Server error: authorize middleware called before authenticate' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
}

module.exports = {
    authorize
};
