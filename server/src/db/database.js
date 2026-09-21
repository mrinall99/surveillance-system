/**
 * High-Performance JSON-Backed Embedded Database Engine.
 * 100% Cross-Platform, Zero Native C++ Compilation Required.
 * Provides a better-sqlite3 compatible interface (prepare, run, get, all, exec).
 * Automatically persists to data/surveillance.json.
 */
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'surveillance.json');

// Initial state data structure
let dbData = {
    admin: [],
    auth_logs: [],
    events: [],
    zones: [],
    cameras: []
};

// Load existing data if present
if (fs.existsSync(dbPath)) {
    try {
        const raw = fs.readFileSync(dbPath, 'utf8');
        dbData = JSON.parse(raw);
        if (!dbData.zones) dbData.zones = [];
        if (!dbData.events) dbData.events = [];
    } catch (e) {
        console.error('Warning: Failed to load database file, creating new database.', e.message);
    }
}

// Ensure default Phase 2 spatial security zones exist
if (!dbData.zones || dbData.zones.length === 0) {
    dbData.zones = [
        {
            id: 1,
            name: "Restricted Main Zone",
            type: "restricted",
            polygon: "[[10,10],[50,10],[50,80],[10,80]]",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            name: "Monitored Perimeter",
            type: "monitored",
            polygon: "[[55,10],[90,10],[90,90],[55,90]]",
            created_at: new Date().toISOString()
        }
    ];
    saveToDisk();
    console.log('🗺️ Auto-seeded default Restricted and Monitored spatial zones');
}

function saveToDisk() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving database to disk:', err.message);
    }
}

class StatementWrapper {
    constructor(sql) {
        this.sql = sql.trim();
    }

    run(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const sql = this.sql.toLowerCase();

        // 1. INSERT INTO admin (username, password_hash) VALUES (?, ?)
        if (sql.includes('insert into admin')) {
            const username = args[0];
            const password_hash = args[1];
            const id = dbData.admin.length + 1;
            dbData.admin.push({
                id,
                username,
                password_hash,
                created_at: new Date().toISOString(),
                last_login: null,
                failed_attempts: 0,
                locked_until: null,
                must_change_pw: 0
            });
            saveToDisk();
            return { changes: 1, lastInsertRowid: id };
        }

        // 2. INSERT INTO auth_logs (action, ip_address, user_agent, details) VALUES (?, ?, ?, ?)
        if (sql.includes('insert into auth_logs')) {
            const id = dbData.auth_logs.length + 1;
            dbData.auth_logs.push({
                id,
                timestamp: new Date().toISOString(),
                action: args[0],
                ip_address: args[1],
                user_agent: args[2],
                details: args[3]
            });
            saveToDisk();
            return { changes: 1 };
        }

        // 3. INSERT INTO zones (name, type, polygon) VALUES (?, ?, ?)
        if (sql.includes('insert into zones')) {
            const id = dbData.zones.length + 1;
            dbData.zones.push({
                id,
                name: args[0],
                type: args[1],
                polygon: typeof args[2] === 'string' ? args[2] : JSON.stringify(args[2]),
                created_at: new Date().toISOString()
            });
            saveToDisk();
            return { changes: 1, lastInsertRowid: id };
        }

        // 4. UPDATE zones SET type = ?, polygon = ? WHERE id = ?
        if (sql.includes('update zones set type = ?, polygon = ? where id = ?')) {
            const type = args[0];
            const polygon = typeof args[1] === 'string' ? args[1] : JSON.stringify(args[1]);
            const zoneId = args[2];
            const zone = dbData.zones.find(z => z.id === zoneId);
            if (zone) {
                zone.type = type;
                zone.polygon = polygon;
                saveToDisk();
            }
            return { changes: zone ? 1 : 0 };
        }

        // 5. DELETE FROM zones WHERE id = ?
        if (sql.includes('delete from zones where id = ?')) {
            const zoneId = args[0];
            const prevLen = dbData.zones.length;
            dbData.zones = dbData.zones.filter(z => z.id !== zoneId);
            saveToDisk();
            return { changes: prevLen - dbData.zones.length };
        }

        // 6. INSERT INTO events
        if (sql.includes('insert into events')) {
            const id = dbData.events.length + 1;
            dbData.events.push({
                id,
                timestamp: new Date().toISOString(),
                camera_id: args[0],
                threat_level: args[1],
                object_class: args[2],
                confidence: args[3],
                track_id: args[4],
                zone_name: args[5],
                metadata: args[6]
            });
            saveToDisk();
            return { changes: 1 };
        }

        // 7. UPDATE admin SET failed_attempts = ?, locked_until = ? WHERE id = ?
        if (sql.includes('update admin set failed_attempts = ?, locked_until = ? where id = ?')) {
            const failed_attempts = args[0];
            const locked_until = args[1];
            const adminId = args[2];
            const admin = dbData.admin.find(a => a.id === adminId);
            if (admin) {
                admin.failed_attempts = failed_attempts;
                admin.locked_until = locked_until;
                saveToDisk();
            }
            return { changes: admin ? 1 : 0 };
        }

        // 8. UPDATE admin SET failed_attempts = ? WHERE id = ?
        if (sql.includes('update admin set failed_attempts = ? where id = ?')) {
            const failed_attempts = args[0];
            const adminId = args[1];
            const admin = dbData.admin.find(a => a.id === adminId);
            if (admin) {
                admin.failed_attempts = failed_attempts;
                saveToDisk();
            }
            return { changes: admin ? 1 : 0 };
        }

        // 9. UPDATE admin SET failed_attempts = 0, locked_until = NULL, last_login = ? WHERE id = ?
        if (sql.includes('update admin set failed_attempts = 0, locked_until = null, last_login = ? where id = ?')) {
            const last_login = args[0];
            const adminId = args[1];
            const admin = dbData.admin.find(a => a.id === adminId);
            if (admin) {
                admin.failed_attempts = 0;
                admin.locked_until = null;
                admin.last_login = last_login;
                saveToDisk();
            }
            return { changes: admin ? 1 : 0 };
        }

        // 10. UPDATE admin SET password_hash = ?
        if (sql.includes('update admin set password_hash = ?')) {
            const password_hash = args[0];
            const adminId = args[1];
            const admin = dbData.admin.find(a => a.id === adminId);
            if (admin) {
                admin.password_hash = password_hash;
                admin.failed_attempts = 0;
                admin.locked_until = null;
                saveToDisk();
            }
            return { changes: admin ? 1 : 0 };
        }

        return { changes: 0 };
    }

    get(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const sql = this.sql.toLowerCase();

        // 1. SELECT COUNT(*) AS count FROM admin
        if (sql.includes('select count(*) as count from admin')) {
            return { count: dbData.admin.length };
        }

        // 2. SELECT * FROM admin WHERE username = ?
        if (sql.includes('select * from admin where username = ?')) {
            const username = args[0];
            return dbData.admin.find(a => a.username === username) || null;
        }

        // 3. SELECT * FROM admin LIMIT 1
        if (sql.includes('select * from admin limit 1')) {
            return dbData.admin[0] || null;
        }

        // 4. SELECT id FROM zones WHERE name = ?
        if (sql.includes('select id from zones where name = ?')) {
            const name = args[0];
            return dbData.zones.find(z => z.name === name) || null;
        }

        return null;
    }

    all(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const sql = this.sql.toLowerCase();

        // 1. SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 100
        if (sql.includes('select * from auth_logs')) {
            return [...dbData.auth_logs].reverse().slice(0, 100);
        }

        // 2. SELECT * FROM zones
        if (sql.includes('select * from zones')) {
            return dbData.zones || [];
        }

        // 3. SELECT * FROM events
        if (sql.includes('select * from events')) {
            const limit = args[0] || 50;
            return [...dbData.events].reverse().slice(0, limit);
        }

        return [];
    }
}

const dbWrapper = {
    prepare: (sql) => new StatementWrapper(sql),
    exec: (sql) => {
        saveToDisk();
    },
    pragma: (str) => {}
};

console.log('✅ Embedded Database Connected & Initialized (JSON Persistence)');

module.exports = dbWrapper;
