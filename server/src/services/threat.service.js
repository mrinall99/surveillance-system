/**
 * Threat Severity Classifier Engine & Loitering Analytics Service.
 * Evaluates detections, spatial zones, and track dwell time into 4 severity levels (LOW, MEDIUM, HIGH, CRITICAL).
 * Logs threats into database events table.
 */
const db = require('../db/database');
const ZoneService = require('./zone.service');

// Memory map for tracking dwell time per persistent Track ID
// { track_id: { first_seen_time: ms, zone_name: str } }
const trackDwellMap = new Map();

class ThreatService {
    /**
     * Evaluates a frame detection payload against spatial zones and loitering rules.
     * @param {Object} payload - Detection frame payload from Python engine
     * @returns {Array<Object>} List of evaluated threat event objects
     */
    static processDetections(payload) {
        const { camera_id, detections, timestamp } = payload;
        const threats = [];
        const now = Date.now();

        for (const det of detections) {
            const { track_id, class: cls_name, confidence, bbox } = det;

            // 1. Spatial Zone Containment Check
            const matchedZone = ZoneService.analyzeDetectionZone(bbox);
            const zoneName = matchedZone ? matchedZone.name : 'Unzoned Area';
            const zoneType = matchedZone ? matchedZone.type : 'none';

            // 2. Dwell-Time / Loitering Analytics Calculation
            let dwellSeconds = 0;
            let isLoitering = false;

            if (track_id !== -1) {
                if (!trackDwellMap.has(track_id)) {
                    trackDwellMap.set(track_id, { first_seen: now, zone_name: zoneName });
                } else {
                    const trackInfo = trackDwellMap.get(track_id);
                    dwellSeconds = Math.floor((now - trackInfo.first_seen) / 1000);
                    // Loiter alert threshold (default 30 seconds for loitering alert trigger)
                    if (dwellSeconds >= 30 && zoneType === 'monitored') {
                        isLoitering = true;
                    }
                }
            }

            // 3. Threat Level Severity Evaluation Matrix
            let threatLevel = 'LOW';
            let threatReason = 'Normal Activity Detected';

            if (cls_name === 'person' && zoneType === 'restricted') {
                threatLevel = 'CRITICAL';
                threatReason = `HUMAN BREACH IN RESTRICTED ZONE '${zoneName}'`;
            } else if ((cls_name === 'car' || cls_name === 'truck' || cls_name === 'motorcycle') && zoneType === 'restricted') {
                threatLevel = 'CRITICAL';
                threatReason = `VEHICLE BREACH IN RESTRICTED ZONE '${zoneName}'`;
            } else if (isLoitering) {
                threatLevel = 'HIGH';
                threatReason = `SUSPICIOUS LOITERING DETECTED (${dwellSeconds}s in '${zoneName}')`;
            } else if (cls_name === 'person' && zoneType === 'monitored') {
                threatLevel = 'MEDIUM';
                threatReason = `Person Monitored in Zone '${zoneName}'`;
            } else if (cls_name === 'dog' || cls_name === 'cat') {
                threatLevel = 'LOW';
                threatReason = `Animal Movement Detected (${cls_name})`;
            }

            const threatEvent = {
                timestamp: timestamp || new Date().toISOString(),
                camera_id,
                threat_level: threatLevel,
                threat_reason: threatReason,
                object_class: cls_name,
                confidence,
                track_id,
                dwell_seconds: dwellSeconds,
                zone_name: zoneName,
                zone_type: zoneType,
                bbox
            };

            // Log HIGH and CRITICAL threats into database
            if (threatLevel === 'HIGH' || threatLevel === 'CRITICAL') {
                this.logThreatEvent(threatEvent);
            }

            threats.push(threatEvent);
        }

        return threats;
    }

    /**
     * Persists threat event record into database.
     */
    static logThreatEvent(evt) {
        try {
            db.prepare(`
                INSERT INTO events (camera_id, threat_level, object_class, confidence, track_id, zone_name, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                evt.camera_id,
                evt.threat_level,
                evt.object_class,
                evt.confidence,
                evt.track_id,
                evt.zone_name,
                JSON.stringify(evt)
            );
        } catch (err) {
            console.error('Error logging threat event to DB:', err.message);
        }
    }

    /**
     * Gets historical threat event logs from DB.
     */
    static getThreatLogs(limit = 50) {
        return db.prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?').all(limit);
    }
}

module.exports = ThreatService;
