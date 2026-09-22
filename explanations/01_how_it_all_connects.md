# 🔗 How All Files Connect — Full System Architecture

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                          │
│                   http://localhost:3000                         │
│                                                                 │
│  React App (Vite)                                               │
│  ├── App.jsx          ← routing, layout                        │
│  ├── Login.jsx        ← secret key login form                  │
│  ├── Dashboard.jsx    ← live feed + stats + threat panel        │
│  ├── Cameras.jsx      ← placeholder camera grid                │
│  ├── Events.jsx       ← historical threat log table            │
│  ├── Settings.jsx     ← config sliders sent to Node.js         │
│  └── useSocket.js     ← Socket.IO client (receives frames)     │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Socket.IO (WebSocket)
                           │  Event: "frame_stream"
                           │  Port 5000
┌──────────────────────────▼──────────────────────────────────────┐
│                    NODE.JS SERVER                               │
│                   http://localhost:5000                         │
│                                                                 │
│  src/index.js         ← main entry, mounts everything          │
│  ├── routes/                                                    │
│  │   ├── auth.routes.js    ← POST /api/auth/login              │
│  │   ├── config.routes.js  ← GET/POST /api/config              │
│  │   └── zone.routes.js    ← GET/POST/DELETE /api/zones        │
│  ├── middleware/                                                 │
│  │   └── auth.middleware.js ← checks JWT cookie on every req   │
│  ├── services/                                                  │
│  │   ├── auth.service.js   ← validates secret key, issues JWT  │
│  │   ├── threat.service.js ← classifies threats LOW→CRITICAL   │
│  │   └── zone.service.js   ← reads/writes zones from DB        │
│  ├── socket/                                                    │
│  │   └── engine-bridge.js  ← connects to Python via WebSocket  │
│  └── db/                                                        │
│      ├── database.js       ← JSON-based embedded database      │
│      └── schema.sql        ← table definitions (reference)     │
└──────────────────────────┬──────────────────────────────────────┘
                           │  WebSocket (ws://)
                           │  Message type: "FRAME_DATA"
                           │  Port 8765
┌──────────────────────────▼──────────────────────────────────────┐
│                    PYTHON CV ENGINE                             │
│                   ws://localhost:8765                           │
│                                                                 │
│  engine/main.py           ← entry point, runs the loop         │
│  ├── config.py            ← reads config.yaml settings         │
│  ├── core/                                                       │
│  │   ├── camera_manager.py ← opens webcam with OpenCV          │
│  │   ├── object_detector.py← runs YOLOv8 inference             │
│  │   ├── tracker.py        ← ByteTrack (assigns track IDs)     │
│  │   └── frame_processor.py← draws boxes, encodes to Base64    │
│  └── server/                                                    │
│      └── ws_server.py     ← sends frames to Node.js            │
└──────────────────────────┬──────────────────────────────────────┘
                           │  reads
┌──────────────────────────▼──────────────────────────────────────┐
│                       WEBCAM                                    │
│              cv2.VideoCapture(0)                                │
└─────────────────────────────────────────────────────────────────┘

DATABASE (always-on, on disk)
  server/data/surveillance.json
  ├── admin[]        ← owner credentials
  ├── auth_logs[]    ← every login attempt recorded
  ├── events[]       ← HIGH/CRITICAL threat events
  ├── zones[]        ← polygon security zones
  └── cameras[]      ← camera source configs
```

---

## Step-by-Step Data Flow (One Frame)

```
Step 1:  Python opens webcam → reads a frame (raw image)
Step 2:  YOLOv8 analyses the frame → returns list of detected objects
Step 3:  ByteTrack assigns a persistent ID to each object (e.g. Person #3)
Step 4:  frame_processor draws bounding boxes on the frame
Step 5:  frame_processor encodes the annotated frame as a Base64 JPEG string
Step 6:  ws_server.py sends {"type":"FRAME_DATA", "frame":"<base64>", "payload":{...}} to Node.js
Step 7:  engine-bridge.js in Node.js receives the message
Step 8:  ThreatService checks each detected object against polygon zones
Step 9:  ThreatService assigns threat level: LOW / MEDIUM / HIGH / CRITICAL
Step 10: HIGH/CRITICAL threats are saved to the database (events table)
Step 11: Node.js emits "frame_stream" event via Socket.IO to all React clients
Step 12: React's useSocket.js receives the event, saves frame to state
Step 13: Dashboard.jsx re-renders: shows new frame image + detection stats
Step 14: LiveFeed.jsx displays the Base64 image using <img src="data:image/jpeg;base64,...">
```

---

## File Connection Map

| File A | Connects To | How |
|--------|------------|-----|
| `main.py` | `camera_manager.py` | Creates CameraManager, calls get_camera() |
| `main.py` | `object_detector.py` | Creates ObjectDetector, passes to tracker |
| `main.py` | `tracker.py` | Creates MultiObjectTracker |
| `main.py` | `frame_processor.py` | Creates FrameProcessor, calls process_frame() |
| `main.py` | `ws_server.py` | Creates EngineWebSocketServer, calls broadcast_frame() |
| `frame_processor.py` | `object_detector.py` | Calls detector.detect() or tracker.track() |
| `ws_server.py` | `engine-bridge.js` | WebSocket connection (port 8765) |
| `engine-bridge.js` | `threat.service.js` | Calls ThreatService.processDetections() |
| `engine-bridge.js` | `zone.service.js` | Calls ZoneService.getZones() |
| `engine-bridge.js` | React (Socket.IO) | Emits "frame_stream" event |
| `threat.service.js` | `database.js` | Writes HIGH/CRITICAL events to DB |
| `zone.service.js` | `database.js` | Reads/writes zones |
| `auth.service.js` | `database.js` | Reads/writes admin + auth_logs |
| `auth.routes.js` | `auth.service.js` | Calls AuthService.login() |
| `zone.routes.js` | `zone.service.js` | Calls ZoneService.getZones() etc. |
| `config.routes.js` | `engine-bridge.js` | Sends config update to Python engine |
| `App.jsx` | `AuthContext.jsx` | Provides login state to all pages |
| `App.jsx` | `useSocket.js` | Gets isConnected + frameData |
| `Dashboard.jsx` | `LiveFeed.jsx` | Passes frameData prop |
| `Dashboard.jsx` | `ThreatPanel.jsx` | Passes threats prop |
| `useSocket.js` | Node.js server | Socket.IO connection on port 5000 |
| `Login.jsx` | Node.js `/api/auth/login` | POST request with secret key |
