# 🛡️ PHASE 2 TECHNICAL DOCUMENTATION — ZONES, THREAT CLASSIFICATION & LOITERING ANALYTICS

> **Presentation Reference Document — Phase 2**
> **Project**: Military-Grade Intelligent Security & Surveillance System
> **Architecture**: Three-Tier Microservice (Python CV Engine ↔ Node.js Backend ↔ React Dashboard)

---

## 📋 Phase 2 Overview & Objectives

Phase 2 introduces **spatial awareness and threat intelligence** to the surveillance system:

### Core Capabilities Built:
- 🗺️ **Interactive Polygon Zone Management**: Define Restricted (🔴 Red), Monitored (🟡 Yellow), and Safe (🟢 Green) zones on live video streams.
- 📐 **Ray-Casting Point-in-Polygon Algorithm**: Mathematical evaluation determining if object centroids lie within spatial security boundaries.
- ⚠️ **4-Level Threat Severity Classification Engine**: Categorizes events into `LOW` 🟢, `MEDIUM` 🟡, `HIGH` 🟠, and `CRITICAL` 🔴.
- ⏱️ **Loitering & Dwell-Time Analytics**: Dwell time calculation per persistent ByteTrack ID; triggers `HIGH` loitering threats if duration exceeds threshold.
- 🔔 **Real-Time Threat Feed**: Glowing alerts, spatial zone overlays, and historical threat event logging into SQLite database.

---

## 🏛️ Spatial Containment & Threat Flow Diagram

```
+-----------------------------------------------------------------------------------+
| 1. OBJECT DETECTION & TRACKING (Python Engine)                                   |
|    YOLOv8 & ByteTrack output: [Bounding Box (x1, y1, x2, y2), Track ID #1]         |
+-----------------------------------------┬-----------------------------------------+
                                          │ (WebSocket Stream)
                                          ▼
+-----------------------------------------------------------------------------------+
| 2. SPATIAL & THREAT EVALUATION ENGINE (Node.js Backend)                          |
|                                                                                   |
|    a) Calculate Normalized Centroid: (centerX %, centerY %)                        |
|    b) Ray-Casting Algorithm: Check vertex intersections against active zones       |
|    c) Dwell-Time Analytics: Calculate elapsed duration (ms) for Track ID #1       |
|    d) Threat Escalation Matrix:                                                   |
|       - Person in Restricted Zone ➔ CRITICAL 🔴                                    |
|       - Vehicle in Restricted Zone ➔ CRITICAL 🔴                                   |
|       - Person Loitering (>30s) in Monitored Zone ➔ HIGH 🟠                        |
|       - Person in Monitored Zone ➔ MEDIUM 🟡                                       |
|       - Animal in Safe Zone ➔ LOW 🟢                                               |
+-----------------------------------------┬-----------------------------------------+
                                          │ (Socket.IO Stream)
                                          ▼
+-----------------------------------------------------------------------------------+
| 3. COMMAND UI STREAM & VISUAL OVERLAY (React Dashboard)                            |
|    - SVG Polygon Overlay drawn over video stream                                  |
|    - Real-Time Threat Feed with glowing alert badges                              |
+-----------------------------------------------------------------------------------+
```

---

## 📁 File-by-File Code Reference (Why, What, Impact)

#### 1. [`server/src/utils/geometry.js`](file:///c:/Users/mrina/Documents/surveillance%20system/server/src/utils/geometry.js)
- **What it does**: Implements the **Ray-Casting Algorithm** for 2D Point-in-Polygon testing and centroid normalization.
- **Why we are using it**: Computes whether an object's center point falls inside arbitrary polygonal boundaries.
- **Impact on program**: Enables custom-shaped polygon security boundaries (not restricted to axis-aligned boxes).

#### 2. [`server/src/services/zone.service.js`](file:///c:/Users/mrina/Documents/surveillance%20system/server/src/services/zone.service.js) & [`zone.routes.js`](file:///c:/Users/mrina/Documents/surveillance%20system/server/src/routes/zone.routes.js)
- **What it does**: Manages zone CRUD persistence in database and queries active zones for containment testing.
- **Why we are using it**: Allows users to save, edit, and delete zones dynamically.
- **Impact on program**: Provides spatial zone configuration without restarting server.

#### 3. [`server/src/services/threat.service.js`](file:///c:/Users/mrina/Documents/surveillance%20system/server/src/services/threat.service.js)
- **What it does**: Evaluates detections against the 4-level threat classification matrix and tracks loitering dwell time per track ID.
- **Why we are using it**: Transforms raw detections into actionable threat intelligence.
- **Impact on program**: Automatically logs `HIGH` and `CRITICAL` breaches to SQLite `events` database.

#### 4. [`client/src/components/zones/ZoneOverlay.jsx`](file:///c:/Users/mrina/Documents/surveillance%20system/client/src/components/zones/ZoneOverlay.jsx)
- **What it does**: Renders SVG polygons directly over the video stream (`#ef4444` for Restricted, `#eab308` for Monitored, `#10b981` for Safe).
- **Why we are using it**: Provides visual confirmation of active security zones on live feeds.

#### 5. [`client/src/components/zones/ZoneEditor.jsx`](file:///c:/Users/mrina/Documents/surveillance%20system/client/src/components/zones/ZoneEditor.jsx)
- **What it does**: Interactive point-and-click polygon drawing tool on top of live video stream.
- **Why we are using it**: Allows administrators to draw custom security perimeters directly on the screen.

#### 6. [`client/src/components/dashboard/ThreatPanel.jsx`](file:///c:/Users/mrina/Documents/surveillance%20system/client/src/components/dashboard/ThreatPanel.jsx)
- **What it does**: Displays a real-time threat feed with glowing pulse indicators on CRITICAL alerts.

---

## 🧠 Mathematical Algorithms Summary (Presentation Slide Reference)

### 1. Ray-Casting Point-in-Polygon Algorithm:
Given point $P = (p_x, p_y)$ and polygon vertices $V = [(x_1, y_1), \dots, (x_n, y_n)]$, cast a ray horizontally to the right ($+X$ direction). Count edge intersections:
$$\text{Intersection Condition}: (y_i > p_y) \neq (y_j > p_y) \quad \land \quad p_x < \frac{(x_j - x_i)(p_y - y_i)}{y_j - y_i} + x_i$$
- **Odd Count** $\implies$ Point is **INSIDE** polygon.
- **Even Count** $\implies$ Point is **OUTSIDE** polygon.

### 2. Dwell-Time Loitering Equation:
$$\Delta t = t_{\text{current}} - t_{\text{first\_seen}}$$
If $\Delta t \ge 30 \text{ seconds}$ inside a `monitored` zone $\implies$ Escalate Threat Level to **HIGH (LOITERING DETECTED)**.
