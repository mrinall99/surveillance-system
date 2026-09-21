/**
 * Single-Owner Secret Key Auth Routes.
 * Express routes for system status, secret key login, logout, session verification, and audit logs.
 */
const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');
const { requireAuth } = require('../middleware/auth.middleware');
const db = require('../db/database');

// GET /api/auth/status — System readiness and lockout status
router.get('/status', (req, res) => {
    try {
        const lockout = AuthService.getLockoutStatus();
        res.json({
            initialized: true,
            authType: 'SECRET_KEY',
            lockout
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/verify — Verifies current cookie session
router.get('/verify', requireAuth, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});

// POST /api/auth/login — Authenticate with Master Secret Key
router.post('/login', (req, res) => {
    try {
        const { secretKey } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const token = AuthService.login(secretKey, ip, userAgent);

        // Set HTTP-only Cookie (8 hours)
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Set to true if running over HTTPS
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Owner access authorized. Terminal unlocked.',
            user: { username: 'OWNER', role: 'owner' }
        });
    } catch (err) {
        res.status(401).json({
            error: err.message,
            lockout: AuthService.getLockoutStatus()
        });
    }
});

// POST /api/auth/logout — Log out owner session
router.post('/logout', (req, res) => {
    const token = req.cookies?.auth_token;
    if (token) {
        const decoded = AuthService.verifyToken(token);
        if (decoded) {
            AuthService.logAuthEvent('OWNER_LOGOUT', req.ip, req.get('User-Agent'), { role: decoded.role });
        }
    }
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/audit-logs — Protected audit trail log retrieval
router.get('/audit-logs', requireAuth, (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 100').all();
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
