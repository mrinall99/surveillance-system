# 🟢 08. Complete Node.js Backend Guide — Master Explanation

---

## 🎯 Purpose of this Guide
This guide explains **everything about the Node.js Backend (`server/`)**: why it exists, how every file works line-by-line, how files connect to each other, and how to answer any backend question in your project viva to get full marks.

---

## 1. Why Do We Have a Backend? (The Big Picture)

In a real-world enterprise AI system, you **never** let the React frontend communicate directly with raw database files or heavy AI scripts without a control plane.

The **Node.js Backend** acts as the **Central Control Plane**:
1. **Security**: Protects user passwords (hashing via `Bcrypt`) and verifies login identity using `JWT (JSON Web Tokens)`.
2. **REST API Gateway**: Provides clean endpoints (`/api/auth`, `/api/zones`, `/api/config`, `/api/threats`) for the React UI.
3. **Data Persistence**: Safely saves and retrieves security logs, drawn zones, and user settings inside `server/data/surveillance.json`.
4. **Bridge**: Relays live camera configuration updates from the web dashboard to the Python AI Engine.

---

## 2. Complete Backend File Connection Map

```
 React Frontend (Port 5173)
           │
           │ HTTP REST Requests (with JWT Bearer Token)
           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. ENTRY POINT: server/src/index.js (Port 5000)        │
 │    - Initializes Express app                           │
 │    - Applies CORS, JSON body parser, Cookie parser     │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. MIDDLEWARE: server/src/middleware/auth.middleware.js│
 │    - Checks Authorization header                       │
 │    - Validates JWT signature                            │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. ROUTES: server/src/routes/                           │
 │    - auth.routes.js   --> Login, Logout, Setup         │
 │    - zone.routes.js   --> Spatial Zone drawing         │
 │    - config.routes.js --> AI Sensitivity tuning        │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. SERVICES: server/src/services/                       │
 │    - auth.service.js   --> Bcrypt hashing & JWT sign   │
 │    - threat.service.js --> Threat event logs & stats   │
 │    - zone.service.js   --> Polygon zone business logic │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 5. DATABASE: server/src/db/database.js                 │
 │    - In-Memory query execution (prepare, run, get, all)│
 │    - Atomic disk save to data/surveillance.json        │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Deep Dive into Every Backend File

### A. Entry Point: `server/src/index.js`
- **What it does**: The starting line of the backend server.
- **Key Code**:
  ```javascript
  const express = require('express');
  const app = express();
  
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(express.json()); // Parses JSON request bodies
  
  app.use('/api/auth', authRoutes);
  app.use('/api/zones', zoneRoutes);
  app.use('/api/config', configRoutes);
  
  app.listen(5000, () => console.log('Server running on port 5000'));
  ```
- **Why it's there**: Express creates the HTTP web server listening on Port 5000. `cors` allows the React client on Port 5173 to send HTTP requests safely without browser cross-origin block errors.

---

### B. Database Adapter: `server/src/db/database.js`
- **What it does**: Manages all data reading and writing to `server/data/surveillance.json`.
- **Key Code**:
  ```javascript
  // Loads JSON into memory on startup
  let dbData = JSON.parse(fs.readFileSync('data/surveillance.json'));
  
  // Atomic Save to prevent corruption
  function saveToDisk() {
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(dbData, null, 2));
    fs.renameSync(tempPath, dbPath); // Atomic OS Swap
  }
  ```
- **Why it's there**: It provides a SQL-like interface (`db.prepare().all()`, `db.prepare().run()`) while keeping data 100% zero-config and portable.

---

### C. Authentication Security: `server/src/services/auth.service.js` & `auth.middleware.js`
- **What it does**: Handles user login, password hashing, and token verification.
- **How Hashing Works**:
  ```javascript
  // Password Hashing on User Creation
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);
  
  // Password Verification on Login
  const isMatch = await bcrypt.compare(candidatePassword, user.password_hash);
  ```
- **How JWT Tokens Work**:
  - When login succeeds, Node generates a signed token:
    `const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });`
  - React attaches this token to every request header: `Authorization: Bearer <token>`.
  - `auth.middleware.js` interceptor calls `jwt.verify(token, JWT_SECRET)`. If token is valid, access is granted.

---

### D. Threat Event Service: `server/src/services/threat.service.js`
- **What it does**: Saves AI detection alert payloads received from the Python engine into `surveillance.json` and calculates summary statistics.
- **Calculated Stats**:
  - Total threat events today.
  - Distribution breakdown by object class (`person`, `car`, `motorcycle`).
  - Hourly distribution histogram data powering the dashboard charts.

---

### E. Zone Management Service: `server/src/services/zone.service.js` & `zone.routes.js`
- **What it does**: Handles REST API requests to create, read, and delete drawn restricted polygon security zones.
- **REST Endpoints**:
  - `GET /api/zones`: Fetches all drawn security zones.
  - `POST /api/zones`: Saves a new drawn polygon zone `[[x1,y1], [x2,y2], ...]`.
  - `DELETE /api/zones/:id`: Removes a zone by ID.

---

## 🎓 Top Backend Viva Questions & Winning Answers

### Q1: "What framework and architecture are you using in the backend?"
> **Answer**:  
> *"We use **Node.js** with the **Express.js** framework following a **Layered Architecture**:  
> Routes → Middleware → Controllers → Services → Database Layer.  
> This ensures high modularity, easy maintenance, and clear separation of concerns."*

---

### Q2: "How is user password security handled in the database?"
> **Answer**:  
> *"Passwords are never saved in cleartext. We use **Bcrypt hashing** with 10 salt rounds.  
> During authentication, we use `bcrypt.compare()` for constant-time hash comparison, which prevents brute-force and timing attacks."*

---

### Q3: "What is JWT, and how does your backend verify request identity?"
> **Answer**:  
> *"JWT stands for **JSON Web Token**. Upon successful login, the server issues a cryptographically signed token containing the user ID and expiration time.  
> The client stores this token and sends it in the `Authorization: Bearer <token>` HTTP header. Our `auth.middleware.js` interceptor verifies the token's cryptographic signature before allowing access to protected routes."*

---

### Q4: "How does your database handle write operations without getting corrupted?"
> **Answer**:  
> *"We use **Atomic OS File Writes**. When updating `server/data/surveillance.json`, we write the JSON string to a temporary file (`surveillance.json.tmp`) first, then call `fs.renameSync()`. The operating system renames the file atomically, ensuring the database never gets corrupted even if power is lost during a write."*
