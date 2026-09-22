# 💡 01. Developer Mindset & Design Decisions

---

## 1. The Core Engineering Challenge

When designing a modern real-time AI surveillance system, an engineer faces three major constraints:

1. **High Computational Demand**: Deep learning models (like YOLOv8) take considerable CPU/GPU resources per video frame. Running them continuously on 30 FPS video feeds without optimization will max out CPU/GPU resources and drop frame rates.
2. **Real-Time Latency Requirement**: Security operators cannot wait for 5 seconds to see an intruder alert. The video stream and detection alert must reach the web UI within milliseconds (< 100ms).
3. **Simplicity vs. Production Capability**: For a college project submission, setting up complex infrastructure like PostgreSQL, Redis, Docker clusters, or heavy microservices makes the project hard to run on an evaluator's laptop. It must be zero-config yet architecturally sound.

---

## 2. Why Split into 3 Tiers? (React + Node.js + Python)

```
┌─────────────────┐       HTTP / WebSocket      ┌─────────────────┐
│ React Frontend  │ <─────────────────────────> │ Node.js Server  │
└─────────────────┘                             └─────────────────┘
        │                                                │
        │             WebSocket Live Stream              │ Config / Alerts
        └────────────────────────────────────────────────┘
                                │
                        ┌─────────────────┐
                        │ Python Engine   │ (OpenCV + YOLOv8)
                        └─────────────────┘
```

### Why not write everything in Python (e.g. Streamlit / Flask UI)?
- **Problem**: Python web interfaces (like Streamlit or Flask templates) freeze when doing heavy computation, lack smooth 60fps animations, and don't provide a modern enterprise UI dashboard.
- **Solution**: React provides a smooth user interface, crisp canvas rendering, and modular component state management.

### Why not write everything in Node.js?
- **Problem**: Node.js is single-threaded and lacks native high-performance bindings for deep learning models like YOLO and raw OpenCV array operations.
- **Solution**: Python is the king of AI, Machine Learning, OpenCV, PyTorch, and YOLO.

### Why have a Node.js Backend between React and Python?
- **Separation of Concerns**: Python should focus purely on computer vision tensor calculations without being bogged down handling user passwords, HTTP routes, sessions, config files, and UI requests.
- **Node.js Strengths**: Node.js excels at asynchronous I/O, REST APIs, JSON manipulation, user authentication (JWT), and managing app configuration.

---

## 3. The "MOG2 Motion Pre-Filter" Innovation (Why it's there)

### The Thought Process:
If a camera streams 30 frames per second, running YOLOv8 on every single frame requires 30 deep neural network passes per second per camera. When nothing is moving in a hallway (e.g., empty room for hours), 99% of those neural network passes are completely wasted!

### The Solution (Dual-Pipeline Gating):
```
Video Frame ──> [ MOG2 Background Subtractor ]
                      │
           Has Motion? │
          ┌────────────┴────────────┐
         YES                        NO
          │                         │
  [ Run YOLOv8 AI ]        [ Skip Heavy AI ]
  [ Track Objects ]        [ Fast Pass Frame ]
          │                         │
          └────────────┬────────────┘
                       ▼
              [ Draw & Stream ]
```

1. **Pass 1 (Lightweight Gate)**: OpenCV's `MOG2` (Mixture of Gaussians) background subtractor compares the current frame against a moving average background model. This takes **< 1ms**.
2. **Pass 2 (Heavy AI)**: If pixel variance exceeds a threshold (motion detected), we invoke `YOLOv8` for object classification & `ByteTrack` for tracking (**~15-30ms**).
3. **Result**: Compute load drops by **70% to 90%** during static scenes, allowing the engine to run smoothly on standard laptops without a high-end dedicated GPU!

---

## 4. Real-Time Communication Choice: WebSockets vs HTTP Polling

| Protocol | Polling | WebSockets |
|---|---|---|
| **Mechanism** | Client asks server every 1 second ("Any new frame?") | Persistent bi-directional TCP pipe |
| **Overhead** | HTTP headers sent 30 times/sec | Single connection setup, low header overhead |
| **Latency** | High (500ms - 1000ms) | Ultra-Low (< 30ms) |
| **Decision** | Rejected ❌ | **Selected ✅** |

- **Why WebSockets?**: For live camera feeds, video frames must be pushed continuously as Base64/JPEG chunks. WebSockets allow the Python engine to push frames directly to the client as fast as they are processed.

---

## 5. Storage Decision: JSON File Database vs SQL Database

### The Thought Process:
- Installing PostgreSQL / MySQL requires installing database service packages, setting up database users, password rules, port bindings, and schema migrations. If an evaluator opens the project on a fresh machine, it will fail to start without database setup.
- SQLite is better, but inspecting SQLite requires sqlite desktop clients.
- **JSON Storage (`lowdb` design)**: Storing zones, users, and threat events inside readable `.json` files ensures:
  1. Zero external dependencies (`npm install` is all you need).
  2. Instant inspection (open `db.json` in VS Code and view all data).
  3. Atomic file writes prevent database corruption.

---

## 6. Security Thought Process (JWT & Bcrypt)

- Even for a college submission, hardcoding cleartext passwords in code is a major security flaw.
- We implemented **Bcrypt** password hashing with 10 salt rounds for stored user credentials.
- We implemented **JWT (JSON Web Tokens)**: Upon login, the backend issues a signed, cryptographically verified token stored in client `localStorage`. Requests to protected routes must provide this token in the `Authorization: Bearer <token>` header.
