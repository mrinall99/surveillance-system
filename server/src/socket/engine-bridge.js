/**
 * Python CV Engine WebSocket Bridge with Phase 2 Threat Intelligence Integration.
 * Receives live base64 JPEG frames and detection metadata.
 * Evaluates spatial zone containment, 4-level threat classification, and loitering analytics.
 * Emits real-time streams to React Socket.IO clients.
 */
const WebSocket = require('ws');
const ThreatService = require('../services/threat.service');
const ZoneService = require('../services/zone.service');

class EngineBridge {
    constructor(engineUrl, ioInstance) {
        this.engineUrl = engineUrl;
        this.io = ioInstance;
        this.ws = null;
        this.reconnectInterval = 3000;
        this.connect();
    }

    connect() {
        console.log(`Connecting to Python CV Engine at ${this.engineUrl}...`);
        this.ws = new WebSocket(this.engineUrl);

        this.ws.on('open', () => {
            console.log('🟢 Connected to Python CV Engine via WebSocket');
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                if (message.type === 'FRAME_DATA') {
                    const payload = message.payload || {};

                    // Phase 2 Threat Classification & Loitering Analytics Evaluation
                    const evaluatedThreats = ThreatService.processDetections(payload);
                    const activeZones = ZoneService.getZones();

                    // Attach evaluated threats and zones to frame payload
                    payload.threats = evaluatedThreats;
                    payload.zones = activeZones;

                    // Determine highest threat level in this frame
                    let highestThreat = 'LOW';
                    for (const t of evaluatedThreats) {
                        if (t.threat_level === 'CRITICAL') highestThreat = 'CRITICAL';
                        else if (t.threat_level === 'HIGH' && highestThreat !== 'CRITICAL') highestThreat = 'HIGH';
                        else if (t.threat_level === 'MEDIUM' && highestThreat === 'LOW') highestThreat = 'MEDIUM';
                    }
                    payload.highest_threat = highestThreat;

                    // Relay frame + enriched payload to React Socket.IO clients
                    this.io.emit('frame_stream', {
                        frame: message.frame,
                        payload
                    });

                    // Emit dedicated alert event for HIGH and CRITICAL threats
                    const highThreats = evaluatedThreats.filter(t => t.threat_level === 'HIGH' || t.threat_level === 'CRITICAL');
                    if (highThreats.length > 0) {
                        this.io.emit('threat_alert', {
                            threats: highThreats,
                            timestamp: payload.timestamp
                        });
                    }
                }
            } catch (err) {
                console.error('Error parsing Python engine message:', err.message);
            }
        });

        this.ws.on('close', () => {
            console.log('🔴 Disconnected from Python CV Engine. Retrying in 3s...');
            setTimeout(() => this.connect(), this.reconnectInterval);
        });

        this.ws.on('error', (err) => {
            console.error('Python Engine WebSocket Error:', err.message);
        });
    }

    sendConfigUpdate(newConfig) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'UPDATE_CONFIG',
                config: newConfig
            }));
            console.log('📡 Broadcasted UPDATE_CONFIG command to Python Engine');
        }
    }
}

module.exports = EngineBridge;
