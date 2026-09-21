/**
 * Authentication Middleware.
 * Protects Express REST API endpoints by validating HTTP-only cookies containing signed JWTs.
 */
const AuthService = require('../services/auth.service');

function requireAuth(req, res, next) {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    req.user = decoded;
    next();
}

module.exports = { requireAuth };
