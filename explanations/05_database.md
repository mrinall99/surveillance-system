# 🗄️ Database Explanation
# Folder: `server/src/db/`

---

## Overview

The project uses a **JSON-file database** (not a real SQL database like MySQL or PostgreSQL).
This was chosen because:
- No installation needed
- Works on any computer without extra setup
- Data is saved to a file: `server/data/surveillance.json`

The database module (`database.js`) provides the **same API as SQLite** so the rest of the
code can write normal SQL-style statements and they just work.

---

## `schema.sql` — Table Definitions (Reference Only)

This file is not actually run. It documents the intended table structure.

```sql
-- TABLE 1: admin
-- Stores the owner's credentials
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- auto-incrementing ID
    username TEXT UNIQUE NOT NULL,          -- e.g. "OWNER"
    password_hash TEXT NOT NULL,           -- bcrypt hashed password (if used)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,                   -- when did the owner last log in?
    failed_attempts INTEGER DEFAULT 0,     -- count of wrong password attempts
    locked_until DATETIME,                 -- if locked, until when?
    must_change_pw BOOLEAN DEFAULT 0       -- force password reset on next login
);

-- TABLE 2: auth_logs
-- Every login attempt is recorded here (forensic audit trail)
CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    -- Possible action values:
    -- 'OWNER_AUTHORIZATION_GRANTED' ← successful login
    -- 'UNAUTHORIZED_KEY_ATTEMPT'    ← wrong key entered
    -- 'INTRUSION_LOCKOUT'           ← 5 failed attempts → locked
    -- 'LOCKOUT_BLOCKED'             ← tried to login while locked
    -- 'OWNER_LOGOUT'                ← logged out
    ip_address TEXT,    -- e.g. "::1" (localhost) or "192.168.1.5"
    user_agent TEXT,    -- browser info e.g. "Chrome/124.0 Windows"
    details TEXT        -- JSON string with extra info
);

-- TABLE 3: events
-- HIGH and CRITICAL threat events are saved here
-- Used by the Events page to show historical alerts
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    camera_id INTEGER NOT NULL,        -- which camera saw it (e.g. 1)
    threat_level TEXT NOT NULL,        -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    object_class TEXT NOT NULL,        -- 'person', 'car', 'motorcycle', etc.
    confidence REAL NOT NULL,          -- 0.0 to 1.0 (e.g. 0.93)
    track_id INTEGER DEFAULT -1,       -- ByteTrack ID (-1 if no tracking)
    zone_name TEXT,                    -- e.g. "Restricted Main Zone"
    snapshot_path TEXT,                -- (not used currently)
    recording_path TEXT,               -- (not used currently)
    metadata TEXT                      -- full JSON payload for this event
);

-- TABLE 4: zones
-- Security polygon zones defined by the user in the UI
CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,         -- e.g. "Front Door"
    type TEXT NOT NULL,
    -- Possible types:
    -- 'restricted' ← person inside = CRITICAL threat
    -- 'monitored'  ← person inside = MEDIUM threat, loitering = HIGH
    -- 'safe'       ← ignored for threat scoring
    polygon TEXT NOT NULL
    -- JSON array of [x%, y%] coordinate pairs
    -- e.g. "[[10,10],[50,10],[50,80],[10,80]]"
    -- Percentages relative to frame size (not pixels)
);

-- TABLE 5: cameras
-- Camera source configurations
CREATE TABLE IF NOT EXISTS cameras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,     -- display name e.g. "Front Entrance"
    source TEXT NOT NULL,   -- "0" = webcam 0, or RTSP URL
    resolution TEXT DEFAULT '640x480',
    fps INTEGER DEFAULT 20,
    status TEXT DEFAULT 'active'
);
```

---

## `database.js` — The JSON-Backed Database Engine

Instead of a real SQL engine, this file simulates SQL using a JavaScript object
stored in memory and periodically saved to a `.json` file on disk.

### Data Structure in Memory:
```js
let dbData = {
    admin:     [],   // array of admin user objects
    auth_logs: [],   // array of auth log objects
    events:    [],   // array of threat event objects
    zones:     [],   // array of zone objects
    cameras:   []    // array of camera config objects
};
```

### Loading from disk on startup:
```js
const dbPath = path.join(dbDir, 'surveillance.json');

if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf8');
    dbData = JSON.parse(raw);
    // ↑ Reads the JSON file and converts it back to the JS object
}
```

### Auto-seeding default zones:
```js
if (!dbData.zones || dbData.zones.length === 0) {
    // No zones exist yet → create two default zones
    dbData.zones = [
        {
            id: 1,
            name: "Restricted Main Zone",
            type: "restricted",
            polygon: "[[10,10],[50,10],[50,80],[10,80]]"
            // ← Left half of the frame is "restricted"
        },
        {
            id: 2,
            name: "Monitored Perimeter",
            type: "monitored",
            polygon: "[[55,10],[90,10],[90,90],[55,90]]"
            // ← Right portion is "monitored"
        }
    ];
    saveToDisk();
}
```

### `saveToDisk()` function:
```js
function saveToDisk() {
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    // JSON.stringify(dbData, null, 2):
    // ↑ Converts JS object back to JSON text with 2-space indentation
    // ↑ So surveillance.json is human-readable
}
```

### `StatementWrapper` class — SQL simulation:
```js
class StatementWrapper {
    constructor(sql) {
        this.sql = sql.trim();   // Store the SQL string
    }

    run(...params) {
        // Simulates: INSERT, UPDATE, DELETE queries
        const sql = this.sql.toLowerCase();

        // Pattern matching: check what kind of SQL this is
        if (sql.includes('insert into admin')) {
            // INSERT INTO admin (username, password_hash) VALUES (?, ?)
            // params[0] = username, params[1] = password_hash
            const id = dbData.admin.length + 1;
            dbData.admin.push({
                id,
                username: params[0],
                password_hash: params[1],
                created_at: new Date().toISOString(),
                last_login: null,
                failed_attempts: 0,
                locked_until: null
            });
            saveToDisk();   // persist to disk immediately
            return { changes: 1, lastInsertRowid: id };
        }

        if (sql.includes('insert into events')) {
            // Records a HIGH or CRITICAL threat event
            const id = dbData.events.length + 1;
            dbData.events.push({
                id,
                timestamp: new Date().toISOString(),
                camera_id:    params[0],
                threat_level: params[1],  // 'HIGH' or 'CRITICAL'
                object_class: params[2],  // 'person', 'car', etc.
                confidence:   params[3],  // e.g. 0.93
                track_id:     params[4],  // ByteTrack ID
                zone_name:    params[5],  // e.g. "Restricted Main Zone"
                metadata:     params[6]   // full JSON event data
            });
            saveToDisk();
            return { changes: 1 };
        }

        // Similar patterns for UPDATE and DELETE operations...
    }

    get(...params) {
        // Simulates: SELECT queries that return ONE row
        const sql = this.sql.toLowerCase();

        if (sql.includes('select * from admin where username = ?')) {
            const username = params[0];
            return dbData.admin.find(a => a.username === username) || null;
            // find() returns the first match or undefined
            // We return null if not found (same as SQLite behavior)
        }

        if (sql.includes('select count(*) as count from admin')) {
            return { count: dbData.admin.length };
        }
        // ...
    }

    all(...params) {
        // Simulates: SELECT queries that return MULTIPLE rows
        const sql = this.sql.toLowerCase();

        if (sql.includes('select * from zones')) {
            return dbData.zones || [];
            // Returns all zones as an array
        }

        if (sql.includes('select * from events')) {
            const limit = params[0] || 50;
            return [...dbData.events].reverse().slice(0, limit);
            // reverse() → newest first
            // slice(0, limit) → only return up to 'limit' items
        }
        // ...
    }
}
```

### The exported wrapper object:
```js
const dbWrapper = {
    prepare: (sql) => new StatementWrapper(sql),
    // ↑ Called like: db.prepare('SELECT * FROM zones').all()
    //   Step 1: db.prepare('SELECT * FROM zones') → creates StatementWrapper
    //   Step 2: .all() → executes the simulated query

    exec: (sql) => { saveToDisk(); },
    // ↑ Used for batch operations (not used much in this project)

    pragma: (str) => {}
    // ↑ SQLite-specific command, not needed for JSON — just ignored
};

module.exports = dbWrapper;
```

---

## How the Database is Used — Examples

### 1. Checking if admin user exists (AuthService):
```js
const count = db.prepare('SELECT COUNT(*) AS count FROM admin').get();
// → calls StatementWrapper.get()
// → returns { count: 1 } or { count: 0 }
```

### 2. Looking up admin by username (AuthService login):
```js
const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get('OWNER');
// → searches dbData.admin array for username === 'OWNER'
// → returns the full admin object or null
```

### 3. Logging a threat event (ThreatService):
```js
db.prepare(`
    INSERT INTO events (camera_id, threat_level, object_class, confidence, track_id, zone_name, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(1, 'CRITICAL', 'person', 0.93, 3, 'Restricted Main Zone', '{"..."}');
// → appends to dbData.events array
// → saves to surveillance.json
```

### 4. Getting all zones (ZoneService):
```js
const zones = db.prepare('SELECT * FROM zones ORDER BY id ASC').all();
// → returns all items from dbData.zones array
// → each zone has: id, name, type, polygon (as JSON string)
```

---

## surveillance.json (the actual data file)

After running the system, this file is created at `server/data/surveillance.json`:

```json
{
  "admin": [],
  "auth_logs": [
    {
      "id": 1,
      "timestamp": "2026-09-22T10:30:01.000Z",
      "action": "OWNER_AUTHORIZATION_GRANTED",
      "ip_address": "::1",
      "user_agent": "Chrome/124.0",
      "details": "{\"role\":\"owner\",\"authMethod\":\"SECRET_KEY\"}"
    }
  ],
  "events": [
    {
      "id": 1,
      "timestamp": "2026-09-22T10:35:20.000Z",
      "camera_id": 1,
      "threat_level": "CRITICAL",
      "object_class": "person",
      "confidence": 0.9312,
      "track_id": 3,
      "zone_name": "Restricted Main Zone",
      "metadata": "{...full event data...}"
    }
  ],
  "zones": [
    {
      "id": 1,
      "name": "Restricted Main Zone",
      "type": "restricted",
      "polygon": "[[10,10],[50,10],[50,80],[10,80]]"
    }
  ],
  "cameras": []
}
```
