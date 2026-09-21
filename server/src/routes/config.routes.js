/**
 * System Configuration API Router.
 * Provides GET and POST endpoints for managing system settings dynamically via the UI.
 * Automatically persists changes to config.yaml and notifies the Python engine.
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { requireAuth } = require('../middleware/auth.middleware');

const configPath = path.join(__dirname, '../../../config.yaml');

// Utility to read current config.yaml
function readConfig() {
    if (!fs.existsSync(configPath)) {
        throw new Error('config.yaml file missing');
    }
    const file = fs.readFileSync(configPath, 'utf8');
    return YAML.parse(file);
}

// Utility to save updated object to config.yaml
function saveConfig(configObj) {
    const yamlStr = YAML.stringify(configObj);
    fs.writeFileSync(configPath, yamlStr, 'utf8');
}

// GET /api/config — Get current system settings
router.get('/', requireAuth, (req, res) => {
    try {
        const config = readConfig();
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/config — Update system settings from UI
router.post('/', requireAuth, (req, res) => {
    try {
        const newSettings = req.body;
        const currentConfig = readConfig();

        // Merge updated settings into current configuration
        const updatedConfig = {
            ...currentConfig,
            detection: {
                ...currentConfig.detection,
                ...(newSettings.detection || {})
            },
            motion: {
                ...currentConfig.motion,
                ...(newSettings.motion || {})
            },
            tracking: {
                ...currentConfig.tracking,
                ...(newSettings.tracking || {})
            },
            alerts: {
                ...currentConfig.alerts,
                ...(newSettings.alerts || {})
            }
        };

        if (newSettings.fps && updatedConfig.cameras?.[0]) {
            updatedConfig.cameras[0].fps = parseInt(newSettings.fps, 10);
        }

        saveConfig(updatedConfig);

        // Notify WebSocket engine bridge if attached
        if (req.app.get('engineBridge')) {
            req.app.get('engineBridge').sendConfigUpdate(updatedConfig);
        }

        res.json({ success: true, message: 'Settings saved successfully', config: updatedConfig });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
