# 🟢 Node.js Backend Explanation
# Folder: `server/src/`

---

## Entry Point: `src/index.js`

This is the first file that runs when you do `npm run dev` on the server.

```js
const express = require('express');    // Web framework for HTTP routes
const http = require('http');          // Node's built-in HTTP module
const { Server } = require('socket.io'); // Real-time socket server
const cookieParser = require('cookie-parser'); // Reads cookies from requests
const cors = require('cors');          // Allows React (port 3000) to talk to server (port 5000)
const YAML = require('yaml');          // Reads config.yaml settings file
```

### Setting up the server:
```js
const PORT = 5000;
const CLIENT_URL = 'http://localhost:3000'; // React app address

const app = express();      // Create the Express application
const server = http.createServer(app); // Wrap Express in an HTTP server

// Attach Socket.IO to the same HTTP server
// This means port 5000 handles BOTH normal HTTP requests AND WebSocket connections
const io = new Server(server, {
    cors: { origin: CLIENT_URL, credentials: true }
    // ↑ Only allow connections from localhost:3000
});
```

### Mounting Routes:
```js
// All login/logout/verify endpoints start with /api/auth
app.use('/api/auth', authRoutes);

// Settings read/write endpoints start with /api/config
app.use('/api/config', configRoutes);

// Zone CRUD endpoints start with /api/zones
app.use('/api/zones', zoneRoutes);
```

### The Engine Bridge:
```js
// Connect to the Python engine running on port 8765
const engineBridge = new EngineBridge('ws://127.0.0.1:8765', io);

// Store the bridge so other route handlers can access it
app.set('engineBridge', engineBridge);
// e.g. config.routes.js can call: req.app.get('engineBridge').sendConfigUpdate(...)
```

### Socket.IO connection handler:
```js
io.on('connection', (socket) => {
    // Fires every time a new React client connects
    console.log(`React Client Connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`React Client Disconnected: ${socket.id}`);
    });
    // Note: we don't need more code here because engine-bridge.js
    // calls io.emit() which sends to ALL connected clients automatically
});
```

---

## `socket/engine-bridge.js` — The Bridge Between Python and React

This is the heart of the real-time system. It connects to Python and forwards frames to React.

```js
class EngineBridge {
    constructor(engineUrl, ioInstance) {
        this.engineUrl = engineUrl;  // 'ws://127.0.0.1:8765'
        this.io = ioInstance;        // Socket.IO server to send to React
        this.reconnectInterval = 3000; // retry after 3 seconds if disconnected
        this.connect();  // Start connecting immediately
    }

    connect() {
        this.ws = new WebSocket(this.engineUrl); // Connect to Python engine

        this.ws.on('open', () => {
            console.log('Connected to Python CV Engine');
            // Now we're ready to receive frames
        });

        this.ws.on('message', (data) => {
            // Fires every time Python sends a new frame (~30 times per second)
            const message = JSON.parse(data);

            if (message.type === 'FRAME_DATA') {
                const payload = message.payload;
                // payload contains: camera_id, timestamp, detections[], has_motion, inference_time_ms

                // STEP 1: Run threat analysis on the detections
                const evaluatedThreats = ThreatService.processDetections(payload);

                // STEP 2: Get all zones from the database
                const activeZones = ZoneService.getZones();

                // STEP 3: Attach threats + zones to the payload
                payload.threats = evaluatedThreats;
                payload.zones = activeZones;

                // STEP 4: Find the worst (highest) threat level in this frame
                let highestThreat = 'LOW';
                for (const t of evaluatedThreats) {
                    if (t.threat_level === 'CRITICAL') highestThreat = 'CRITICAL';
                    else if (t.threat_level === 'HIGH' && highestThreat !== 'CRITICAL') highestThreat = 'HIGH';
                    else if (t.threat_level === 'MEDIUM' && highestThreat === 'LOW') highestThreat = 'MEDIUM';
                }
                payload.highest_threat = highestThreat;

                // STEP 5: Forward to React clients via Socket.IO
                this.io.emit('frame_stream', {
                    frame: message.frame,   // ← the Base64 JPEG image
                    payload                 // ← enriched with threats + zones
                });

                // STEP 6: If HIGH or CRITICAL → also send a dedicated alert event
                const highThreats = evaluatedThreats.filter(
                    t => t.threat_level === 'HIGH' || t.threat_level === 'CRITICAL'
                );
                if (highThreats.length > 0) {
                    this.io.emit('threat_alert', { threats: highThreats });
                }
            }
        });

        this.ws.on('close', () => {
            // Python engine disconnected — retry in 3 seconds
            setTimeout(() => this.connect(), this.reconnectInterval);
        });
    }

    sendConfigUpdate(newConfig) {
        // Called by config.routes.js when user changes settings in the UI
        // Sends the new settings back to the Python engine
        this.ws.send(JSON.stringify({
            type: 'UPDATE_CONFIG',
            config: newConfig
        }));
    }
}
```

---

## `middleware/auth.middleware.js` — Route Protection

```js
function requireAuth(req, res, next) {
    // Read the auth token from either:
    // a) An HTTP-only cookie named "auth_token"
    // b) An Authorization: Bearer <token> header
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
        // ↑ Stop here. The actual route code never runs.
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Session expired' });
    }

    req.user = decoded; // ← Attach user info to the request object
    next();             // ← Allow the request to continue to the route handler
}
```

**How it's used:**
```js
// In auth.routes.js:
router.get('/audit-logs', requireAuth, (req, res) => { ... });
//                         ↑ requireAuth runs FIRST. If it calls next(), the
//                           function after it runs. If not, it sends 401.
```

---

## `routes/auth.routes.js` — Login / Logout / Session

### GET `/api/auth/status`
- Returns: is the system initialized? is it locked out?
- React Login page calls this on load to show remaining attempts

### GET `/api/auth/verify`
- Protected by `requireAuth` middleware
- Returns: `{ authenticated: true, user: {...} }`
- React's `AuthContext` calls this on startup to check if still logged in

### POST `/api/auth/login`
```
Request body: { secretKey: "Mrinal@2006" }

1. Call AuthService.login(secretKey, ip, userAgent)
2. If correct → get back a signed JWT token
3. Set the JWT as an HTTP-only cookie (browser stores it automatically)
4. Response: { success: true, user: { username: 'OWNER', role: 'owner' } }

If wrong key → 401 error with remaining attempts count
If locked → 401 error with lockout duration
```

### POST `/api/auth/logout`
- Clears the auth cookie
- Logs the logout event in the database

### GET `/api/auth/audit-logs`
- Returns the last 100 login/logout events from the database

---

## `routes/config.routes.js` — Live Settings

### GET `/api/config`
- Reads `config.yaml` from the root folder
- Returns the full configuration to the Settings page

### POST `/api/config`
```
Request body: { detection: { confidence_threshold: 0.6 }, fps: 20 }

1. Read current config.yaml
2. Merge the new settings into it (don't overwrite unrelated fields)
3. Write updated config.yaml back to disk
4. Call engineBridge.sendConfigUpdate() → Python engine applies changes LIVE
5. Response: { success: true, config: updatedConfig }
```

---

## `routes/zone.routes.js` — Security Zone Management

### GET `/api/zones`
- Returns all polygon zones from the database
- React's LiveFeed calls this to draw zone overlays on the camera feed

### POST `/api/zones`
```
Request body: { name: "Front Door", type: "restricted", polygon: [[10,10],[50,10],...] }

1. Validates the input
2. Calls ZoneService.saveZone() → creates or updates in database
3. Response: { success: true, zone: { id, name, type, polygon } }
```

### DELETE `/api/zones/:id`
- Deletes a zone by its ID from the database

### GET `/api/zones/events`
- Returns historical threat event logs (from the events table)
- Used by the Events page

---

## `services/auth.service.js` — Authentication Logic

```js
static getOwnerSecretKey() {
    // Priority 1: OWNER_SECRET_KEY environment variable
    if (process.env.OWNER_SECRET_KEY) return process.env.OWNER_SECRET_KEY;

    // Priority 2: Read directly from server/.env file
    // (looks for: OWNER_SECRET_KEY=Mrinal@2006)

    // Priority 3: config.yaml → auth.owner_secret_key

    // Priority 4: Hardcoded default → 'Mrinal@2006'
}

static login(submittedSecretKey, ipAddress, userAgent) {
    // Check lockout first (5 failed = 15 min lockout)
    if (status.locked) throw new Error('Terminal locked...');

    const configuredKey = this.getOwnerSecretKey();

    // IMPORTANT: Constant-time comparison (prevents timing attacks)
    // Normal == comparison leaks info about how many chars match
    // crypto.timingSafeEqual always takes the same time regardless
    const isMatch = crypto.timingSafeEqual(
        Buffer.from(submittedKey),
        Buffer.from(configuredKey)
    );

    if (!isMatch) {
        lockoutState.failedAttempts += 1;
        if (attempts >= 5) {
            lockoutState.lockedUntil = Date.now() + 15 * 60 * 1000;
        }
        throw new Error(`Wrong key. ${remaining} attempts remaining.`);
    }

    // Success: issue JWT token (valid for 8 hours)
    return jwt.sign({ role: 'owner' }, JWT_SECRET, { expiresIn: '8h' });
}
```

---

## `services/threat.service.js` — Threat Classification

Called for every single frame (~30 times per second).

```js
static processDetections(payload) {
    for (const det of detections) {
        // 1. Find which zone the detected object is in
        const matchedZone = ZoneService.analyzeDetectionZone(det.bbox);
        // bbox = [x1, y1, x2, y2] pixel coordinates of the bounding box

        // 2. Calculate how long this object has been in view (dwell time)
        // Uses track_id to remember: "Person #3 was first seen 45 seconds ago"
        if (!trackDwellMap.has(track_id)) {
            trackDwellMap.set(track_id, { first_seen: now });
        }
        const dwellSeconds = (now - trackInfo.first_seen) / 1000;
        const isLoitering = dwellSeconds >= 30 && zone.type === 'monitored';

        // 3. Threat level decision matrix:
        if (cls_name === 'person' && zone.type === 'restricted') → 'CRITICAL'
        if (vehicle && zone.type === 'restricted')               → 'CRITICAL'
        if (isLoitering)                                          → 'HIGH'
        if (cls_name === 'person' && zone.type === 'monitored') → 'MEDIUM'
        if (cls_name === 'dog' || 'cat')                         → 'LOW'

        // 4. Save HIGH/CRITICAL threats to database
        if (threatLevel === 'HIGH' || threatLevel === 'CRITICAL') {
            this.logThreatEvent(threatEvent);
        }
    }
}
```

---

## `services/zone.service.js` — Zone Management

```js
static analyzeDetectionZone(bbox) {
    // bbox = [x1, y1, x2, y2] pixel coordinates
    // Step 1: Find the centroid (center point) of the bounding box
    const centroid = getNormalizedCentroid(bbox, 640, 480);
    // Converts from pixels (e.g. x=320) to percentage (e.g. x=50)

    // Step 2: Check each zone polygon using ray-casting algorithm
    for (const zone of zones) {
        if (isPointInPolygon(centroid, zone.polygon)) {
            return zone; // ← object is inside this zone
        }
    }
    return null; // ← object is not in any zone
}
```

**What is a polygon zone?**
Zones are defined as a list of percentage-based points:
```
[[10, 10], [50, 10], [50, 80], [10, 80]]
```
This means: top-left=10%,10% ... bottom-right=50%,80% of the frame.
The ray-casting algorithm checks if the object's center point falls inside this shape.
