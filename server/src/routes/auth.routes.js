/**
 * Auth Router Endpoints.
 * Express routes for system initialization, login, logout, and security audit log retrieval.
 */
const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');
const { requireAuth } = require('../middleware/auth.middleware');
const db = require('../db/database');

// GET /api/auth/status — Check if admin account is configured
router.get('/status', (req, res) => {
    try {
        const initialized = AuthService.isInitialized();
        res.json({ initialized });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/setup — Initial admin registration
router.post('/setup', (req, res) => {
    try {
        const { username, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const token = AuthService.setupAdmin(username, password, ip, userAgent);

        // Set HTTP-only Cookie (8 hours)
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Set to true if running HTTPS
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        });

        res.json({ success: true, message: 'Admin account created successfully.', username });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/auth/login — Admin authentication
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const token = AuthService.login(username, password, ip, userAgent);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        });

        res.json({ success: true, message: 'Authentication successful.', username });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// POST /api/auth/logout — Log out admin
router.post('/logout', (req, res) => {
    const token = req.cookies?.auth_token;
    if (token) {
        const decoded = AuthService.verifyToken(token);
        if (decoded) {
            AuthService.logAuthEvent('LOGOUT', req.ip, req.get('User-Agent'), { username: decoded.username });
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
