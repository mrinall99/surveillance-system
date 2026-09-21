/**
 * Single-Owner Secret Key Authentication Service.
 * 
 * Exclusively authenticates the owner via a master secret key.
 * - Zero multi-user / third-party accounts.
 * - Timing-safe constant-time secret comparison (mitigates timing side-channels).
 * - 5-strike brute-force lockout defense with automatic cooldown.
 * - Forensic audit logging of every authorization & breach attempt.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const db = require('../db/database');

// Read config.yaml fallback
const configPath = path.join(__dirname, '../../../config.yaml');
let configYaml = {};
if (fs.existsSync(configPath)) {
    try {
        configYaml = YAML.parse(fs.readFileSync(configPath, 'utf8')) || {};
    } catch (e) {}
}

const JWT_SECRET = process.env.JWT_SECRET || configYaml.auth?.jwt_secret || 'HAWKEYE_PROPRIETARY_JWT_ENCRYPTION_SECRET_2026_CLASSIFIED';

// In-memory lockout and rate limiting tracker for secret key attempts
const lockoutState = {
    failedAttempts: 0,
    lockedUntil: null
};

class AuthService {
    /**
     * Retrieves the configured Master Owner Secret Key from environment, config, or database.
     */
    static getOwnerSecretKey() {
        return (
            process.env.OWNER_SECRET_KEY ||
            configYaml.auth?.owner_secret_key ||
            'HAWKEYE-MASTER-OWNER-KEY-2026'
        );
    }

    /**
     * Checks system authorization readiness.
     */
    static isInitialized() {
        return true; // Secret-key system is pre-provisioned and ready
    }

    /**
     * Returns current lockout status.
     */
    static getLockoutStatus() {
        const now = Date.now();
        if (lockoutState.lockedUntil && now < lockoutState.lockedUntil) {
            const remainingSeconds = Math.ceil((lockoutState.lockedUntil - now) / 1000);
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            return {
                locked: true,
                remainingSeconds,
                remainingMinutes
            };
        }
        if (lockoutState.lockedUntil && now >= lockoutState.lockedUntil) {
            // Lockout expired
            lockoutState.lockedUntil = null;
            lockoutState.failedAttempts = 0;
        }
        return {
            locked: false,
            failedAttempts: lockoutState.failedAttempts,
            remainingAttempts: Math.max(0, 5 - lockoutState.failedAttempts)
        };
    }

    /**
     * Authenticates owner with secret key.
     * Uses constant-time timingSafeEqual comparison.
     */
    static login(submittedSecretKey, ipAddress, userAgent) {
        const status = this.getLockoutStatus();
        if (status.locked) {
            this.logAuthEvent('LOCKOUT_BLOCKED', ipAddress, userAgent, {
                reason: 'Terminal locked due to excessive failed attempts',
                remainingMinutes: status.remainingMinutes
            });
            throw new Error(`Terminal locked due to repeated invalid key attempts. Cooldown active: ${status.remainingMinutes}m remaining.`);
        }

        if (!submittedSecretKey || typeof submittedSecretKey !== 'string') {
            throw new Error('Secret key is required for system authorization.');
        }

        const configuredKey = this.getOwnerSecretKey();

        // Perform timing-safe comparison
        const submittedBuffer = Buffer.from(submittedSecretKey.trim());
        const configuredBuffer = Buffer.from(configuredKey.trim());

        let isMatch = false;
        if (submittedBuffer.length === configuredBuffer.length) {
            isMatch = crypto.timingSafeEqual(submittedBuffer, configuredBuffer);
        }

        if (!isMatch) {
            lockoutState.failedAttempts += 1;
            const attempts = lockoutState.failedAttempts;

            if (attempts >= 5) {
                lockoutState.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minute lockout
                this.logAuthEvent('INTRUSION_LOCKOUT', ipAddress, userAgent, {
                    action: '5 consecutive invalid secret key attempts',
                    lockoutMinutes: 15
                });
                throw new Error('Terminal locked for 15 minutes due to 5 consecutive unauthorized key attempts.');
            } else {
                const remaining = 5 - attempts;
                this.logAuthEvent('UNAUTHORIZED_KEY_ATTEMPT', ipAddress, userAgent, {
                    failedAttempts: attempts,
                    remainingAttempts: remaining
                });
                throw new Error(`Unauthorized Secret Key. ${remaining} attempt(s) remaining before terminal lockout.`);
            }
        }

        // Key is valid: Reset lockout counters
        lockoutState.failedAttempts = 0;
        lockoutState.lockedUntil = null;

        // Log forensic event
        this.logAuthEvent('OWNER_AUTHORIZATION_GRANTED', ipAddress, userAgent, {
            role: 'owner',
            authMethod: 'SECRET_KEY'
        });

        // Issue signed JWT token
        return this.generateToken();
    }

    /**
     * Issues signed JWT valid for 8 hours for the verified Owner.
     */
    static generateToken() {
        return jwt.sign(
            { role: 'owner', username: 'OWNER', authType: 'secret_key' },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
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
        try {
            const stmt = db.prepare(
                'INSERT INTO auth_logs (action, ip_address, user_agent, details) VALUES (?, ?, ?, ?)'
            );
            stmt.run(action, ipAddress || '127.0.0.1', userAgent || 'Unknown', JSON.stringify(detailsObj));
        } catch (e) {
            console.error('Failed to write auth log:', e.message);
        }
    }
}

module.exports = AuthService;
