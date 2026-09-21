/**
 * Zone Management & Containment Analysis Service.
 * Manages spatial security zones and checks detected objects against zone polygons.
 */
const db = require('../db/database');
const { isPointInPolygon, getNormalizedCentroid } = require('../utils/geometry');

class ZoneService {
    /**
     * Retrieves all active zones from database / fallback.
     */
    static getZones() {
        const rows = db.prepare('SELECT * FROM zones ORDER BY id ASC').all();
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type, // 'restricted' | 'monitored' | 'safe'
            polygon: JSON.parse(r.polygon)
        }));
    }

    /**
     * Creates or updates a polygon zone.
     */
    static saveZone(name, type, polygon) {
        const existing = db.prepare('SELECT id FROM zones WHERE name = ?').get(name);
        const polyJson = JSON.stringify(polygon);

        if (existing) {
            db.prepare('UPDATE zones SET type = ?, polygon = ? WHERE id = ?')
                .run(type, polyJson, existing.id);
            return { id: existing.id, name, type, polygon };
        } else {
            const res = db.prepare('INSERT INTO zones (name, type, polygon) VALUES (?, ?, ?)')
                .run(name, type, polyJson);
            return { id: res.lastInsertRowid, name, type, polygon };
        }
    }

    /**
     * Deletes a zone by ID.
     */
    static deleteZone(id) {
        db.prepare('DELETE FROM zones WHERE id = ?').run(id);
        return true;
    }

    /**
     * Seeds initial default zones if table is empty.
     */
    static seedDefaultZones() {
        const zones = this.getZones();
        if (zones.length === 0) {
            // Default Restricted Entrance Zone
            this.saveZone('Restricted Main Zone', 'restricted', [[10, 10], [50, 10], [50, 80], [10, 80]]);
            // Default Monitored Perimeter Zone
            this.saveZone('Monitored Perimeter', 'monitored', [[55, 10], [90, 10], [90, 90], [55, 90]]);
            console.log('🗺️ Seeded default Restricted & Monitored security zones');
        }
    }

    /**
     * Checks which zone (if any) a detection falls into.
     * @param {[number, number, number, number]} bbox - [x1, y1, x2, y2]
     * @returns {Object|null} Matching zone object or null
     */
    static analyzeDetectionZone(bbox) {
        const centroid = getNormalizedCentroid(bbox, 640, 480);
        const zones = this.getZones();

        for (const zone of zones) {
            if (isPointInPolygon(centroid, zone.polygon)) {
                return zone;
            }
        }

        return null;
    }
}

// Seed default zones on load
ZoneService.seedDefaultZones();

module.exports = ZoneService;
