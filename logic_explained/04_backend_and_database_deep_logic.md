# 🟢 04. Node.js Backend & Database — Deep Logic Breakdown

---

## 1. Backend Architecture Overview

The Node.js backend located in `server/src/` serves as the control plane for the surveillance system. It enforces layered enterprise design patterns:

```
  HTTP Request (from React Client / Python Engine)
                        │
                        ▼
             ┌─────────────────────┐
             │ Express Router      │ (e.g. auth.routes.js, threat.routes.js)
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Middleware Layer    │ (CORS, Auth JWT Verification, Error Handling)
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Controller Layer    │ (Request Parsing & Input Validation)
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Service Layer       │ (Business Logic & Statistics Computation)
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Database Layer      │ (JSON Storage Driver — db.js)
             └─────────────────────┘
```

---

## 2. Layer-by-Layer Logic Breakdown

### A. Middleware Layer (`server/src/middleware/auth.middleware.js`)
- **Purpose**: Guard API routes so unauthenticated requests are rejected immediately.
- **Logic**:
  1. Extracts token from `req.headers.authorization`.
  2. Format check: `Bearer <JWT_TOKEN_STRING>`.
  3. Uses `jwt.verify(token, JWT_SECRET)` to validate cryptographic signature and expiration.
  4. If valid, attaches decoded user object (`req.user`) to request context and calls `next()`.
  5. If invalid/expired, returns HTTP `401 Unauthorized`.

---

### B. Auth Service & Bcrypt (`server/src/services/auth.service.js`)
- **Password Hashing**:
  - Raw passwords are NEVER stored in plain text.
  - When creating/updating users, `bcrypt.hash(password, 10)` generates a salted hash.
  - Salt factor `10` ensures brute-force protection while taking ~100ms per hash verification.
- **Login Verification**:
  - `bcrypt.compare(candidatePassword, storedHash)` evaluates match in constant time to prevent side-channel timing attacks.
  - Generates JWT signed payload: `{ id, username, role, exp: Date.now() + 24h }`.

---

### C. Threat Event Service (`server/src/services/threat.service.js`)
- **Purpose**: Processes threat events emitted by Python CV engine and calculates analytical statistics for the React dashboard.
- **Key Methods**:
  - `logThreatEvent(eventData)`: Formats event payload, generates auto-incrementing ID, attaches ISO timestamp, and appends to database.
  - `getThreatStats()`: Calculates real-time analytics:
    - Total events today.
    - Breakdowns by object class (e.g., 80% Person, 20% Vehicle).
    - Breakdown by severity (`CRITICAL`, `WARNING`, `INFO`).
    - Hourly distribution histogram data for charts.

---

## 3. Database Layer — LowDB JSON Mechanics (`server/src/db/db.js`)

### Why Custom JSON File DB over SQL?
- High portability: Runs out of the box on Windows, macOS, and Linux without installing MySQL, PostgreSQL, or MongoDB services.
- Data clarity: Humans can read `server/src/db/db.json` directly.

### Internal Data Schema Structure (`db.json`):
```json
{
  "users": [
    { "id": 1, "username": "admin", "password_hash": "$2b$10$...", "role": "admin" }
  ],
  "events": [
    {
      "id": 1,
      "timestamp": "2026-09-22T10:35:20.000Z",
      "camera_id": 1,
      "threat_level": "CRITICAL",
      "object_class": "person",
      "confidence": 0.93,
      "track_id": 3,
      "zone_name": "Restricted Main Zone"
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
  "cameras": [
    { "id": 1, "name": "Entrance Camera", "source": "0", "status": "active" }
  ]
}
```

### Atomic File Write Protection
To prevent corrupting `db.json` if power drops or the server crashes while writing:
1. Data is stringified: `const json = JSON.stringify(data, null, 2)`.
2. Written to a temporary file: `db.json.tmp`.
3. Renamed to target file: `fs.renameSync('db.json.tmp', 'db.json')` (Atomic OS operation).
