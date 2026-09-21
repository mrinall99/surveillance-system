/**
 * Zone Management API Router.
 * Provides REST endpoints for querying, creating, and deleting polygonal security zones.
 */
const express = require('express');
const router = express.Router();
const ZoneService = require('../services/zone.service');
const ThreatService = require('../services/threat.service');
const { requireAuth } = require('../middleware/auth.middleware');

// GET /api/zones — Retrieve all security zones
router.get('/', requireAuth, (req, res) => {
    try {
        const zones = ZoneService.getZones();
        res.json({ success: true, zones });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/zones — Create or update a security zone
router.post('/', requireAuth, (req, res) => {
    try {
        const { name, type, polygon } = req.body;
        if (!name || !type || !polygon || !Array.isArray(polygon)) {
            return res.status(400).json({ error: 'Invalid zone payload. Require name, type, and polygon array.' });
        }

        const savedZone = ZoneService.saveZone(name, type, polygon);
        res.json({ success: true, zone: savedZone });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/zones/:id — Delete a zone by ID
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const zoneId = parseInt(req.params.id, 10);
        ZoneService.deleteZone(zoneId);
        res.json({ success: true, message: `Zone ID ${zoneId} deleted.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/zones/events — Historical threat events list
router.get('/events', requireAuth, (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 150;
        const logs = ThreatService.getThreatLogs(limit);
        res.json({ success: true, events: logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/zones/events — Clear historical threat logs
router.delete('/events', requireAuth, (req, res) => {
    try {
        const db = require('../db/database');
        db.prepare('DELETE FROM events').run();
        res.json({ success: true, message: 'Threat event logs cleared.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
