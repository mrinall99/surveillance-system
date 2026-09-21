/**
 * Government-Grade Authentication Service.
 * Implements bcrypt hashing, JWT issuance, 5-strike brute-force lockout, and SQLite audit logging.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'SURVEILLANCE_CLASSIFIED_JWT_SECRET_KEY_2026';

class AuthService {
    /**
     * Checks if admin account exists in database.
     */
    static isInitialized() {
        const row = db.prepare('SELECT COUNT(*) AS count FROM admin').get();
        return row.count > 0;
    }

    /**
     * First-time setup wizard for creating owner credentials.
     */
    static setupAdmin(username, password, ipAddress, userAgent) {
        if (this.isInitialized()) {
            throw new Error('System already initialized. Setup endpoint disabled.');
        }

        if (!password || password.length < 8) {
            throw new Error('Password must be at least 8 characters long.');
        }

        const saltRounds = 12;
        const passwordHash = bcrypt.hashSync(password, saltRounds);

        const stmt = db.prepare(
            'INSERT INTO admin (username, password_hash) VALUES (?, ?)'
        );
        stmt.run(username, passwordHash);

        // Audit Log
        this.logAuthEvent('SETUP', ipAddress, userAgent, { username });

        // Generate initial login token
        return this.generateToken(username);
    }

    /**
     * Admin login handler with lockout protection.
     */
    static login(username, password, ipAddress, userAgent) {
        const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);

        if (!admin) {
            this.logAuthEvent('LOGIN_FAILED', ipAddress, userAgent, { username, reason: 'Invalid username' });
            throw new Error('Invalid credentials');
        }

        // Check Account Lockout status
        if (admin.locked_until) {
            const lockUntil = new Date(admin.locked_until).getTime();
            const now = new Date().getTime();

            if (now < lockUntil) {
                const remainingMinutes = Math.ceil((lockUntil - now) / (60 * 1000));
                this.logAuthEvent('LOCKOUT', ipAddress, userAgent, { username, remainingMinutes });
                throw new Error(`Account locked due to multiple failed login attempts. Try again in ${remainingMinutes} minutes.`);
            } else {
                // Lock period expired: reset counter
                db.prepare('UPDATE admin SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(admin.id);
            }
        }

        // Verify password hash
        const isMatch = bcrypt.compareSync(password, admin.password_hash);

        if (!isMatch) {
            const failedAttempts = (admin.failed_attempts || 0) + 1;
            let lockedUntil = null;

            if (failedAttempts >= 5) {
                // Lock account for 30 minutes after 5 failed attempts
                lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                db.prepare('UPDATE admin SET failed_attempts = ?, locked_until = ? WHERE id = ?')
                    .run(failedAttempts, lockedUntil, admin.id);

                this.logAuthEvent('LOCKOUT', ipAddress, userAgent, { username, failedAttempts });
                throw new Error('Account locked due to 5 consecutive failed login attempts. Lockout active for 30 minutes.');
            } else {
                db.prepare('UPDATE admin SET failed_attempts = ? WHERE id = ?').run(failedAttempts, admin.id);
                const remaining = 5 - failedAttempts;
                this.logAuthEvent('LOGIN_FAILED', ipAddress, userAgent, { username, failedAttempts });
                throw new Error(`Invalid credentials. ${remaining} attempt(s) remaining before account lockout.`);
            }
        }

        // Successful Authentication: Reset failed attempts & update last login timestamp
        const nowIso = new Date().toISOString();
        db.prepare('UPDATE admin SET failed_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?')
            .run(nowIso, admin.id);

        this.logAuthEvent('LOGIN_SUCCESS', ipAddress, userAgent, { username });

        return this.generateToken(admin.username);
    }

    /**
     * Issues signed JWT valid for 8 hours.
     */
    static generateToken(username) {
        return jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    }

    /**
     * Verifies signed JWT token.
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return null;
        }
    }

    /**
     * Writes auth event to audit log table.
     */
    static logAuthEvent(action, ipAddress, userAgent, detailsObj = {}) {
        const stmt = db.prepare(
            'INSERT INTO auth_logs (action, ip_address, user_agent, details) VALUES (?, ?, ?, ?)'
        );
        stmt.run(action, ipAddress || '127.0.0.1', userAgent || 'Unknown', JSON.stringify(detailsObj));
    }
}

module.exports = AuthService;
