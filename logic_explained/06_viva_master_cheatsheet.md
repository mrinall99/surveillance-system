# 🎓 06. Viva Master Cheat Sheet — Top 20 Examiner Questions & Winning Answers

---

## 🏆 How to Ace Your Project Viva
When professors examine your project, they evaluate:
1. **System Design Rationale**: Did you copy code blindly, or do you know *why* each technology was selected?
2. **Trade-offs**: Do you understand the pros/cons of your choices (e.g. MOG2 vs No MOG2, WebSockets vs HTTP, JSON DB vs SQL)?
3. **End-to-End Data Flow**: Can you trace a video frame from camera capture to UI screen display?

Below are the **exact questions professors ask** and the **exact high-scoring answers** to speak out loud.

---

## 📌 Category 1: System Architecture & Design Choices

### Q1: "Why did you split the system into 3 separate components (React, Node.js, Python) instead of building a monolithic app?"
> **Winning Answer**:  
> *"We followed a microservices separation of concerns architecture.  
> 1. **Python** is the industry standard for AI tensor calculations, PyTorch, and OpenCV image processing.  
> 2. **Node.js** excels at non-blocking asynchronous I/O, REST APIs, user authentication, and business rule evaluation.  
> 3. **React** provides a responsive, component-driven UI dashboard for 60fps rendering.  
> Splitting them prevents heavy deep learning matrix math in Python from blocking web server APIs or freezing the user interface."*

---

### Q2: "What is MOG2 background subtraction, and why use it before YOLOv8?"
> **Winning Answer**:  
> *"MOG2 (Mixture of Gaussians v2) is a computer vision algorithm that models each pixel's background color history. It creates a motion mask in **< 1ms**.  
> We use MOG2 as a lightweight **gating pre-filter**. If a surveillance camera is pointing at an empty room for hours, MOG2 detects zero motion and skips YOLO deep learning inference. This reduces CPU/GPU resource consumption by over 70% during idle hours while maintaining 30 FPS video throughput."*

---

### Q3: "What would happen if you removed MOG2?"
> **Winning Answer**:  
> *"If MOG2 is removed, YOLOv8 will run on every single video frame (30 times per second). On standard laptop hardware, CPU usage will spike to 100%, causing frame drops and stream latency (> 500ms lag).  
> The only advantage of removing MOG2 is that YOLO would continuously detect a person sitting completely frozen like a statue for hours. However, the computational cost outweighs this edge case."*

---

### Q4: "Why use WebSockets instead of standard HTTP REST polling for video streaming?"
> **Winning Answer**:  
> *"Standard HTTP REST requires opening and closing a TCP handshake for every request, which creates massive network header overhead when streaming 30 frames per second.  
> WebSockets establish a single persistent, bi-directional TCP pipe. The Python engine pushes Base64/JPEG frame payloads directly to the browser with ultra-low latency (< 30ms)."*

---

### Q5: "Why did you use a JSON file-based database (`lowdb`) instead of PostgreSQL or MySQL?"
> **Winning Answer**:  
> *"For low deployment overhead and zero-config portability. Running SQL engines requires installing external service daemons (like MySQL/PostgreSQL), setting up database users, network ports, and running SQL migration scripts.  
> With our JSON storage architecture, the application is 100% self-contained and runs immediately on any machine with `npm install`, while maintaining full ACID-like atomic writes."*

---

## 📌 Category 2: AI & Computer Vision (Python Engine)

### Q6: "How does YOLOv8 work, and how does it differ from older YOLO versions?"
> **Winning Answer**:  
> *"YOLOv8 (You Only Look Once v8) is an anchor-free object detection neural network. Older versions relied on rigid predefined anchor boxes to guess object shapes. YOLOv8 predicts object center points directly, which improves small-object detection precision and inference speed."*

---

### Q7: "Why do you need ByteTrack when YOLO already detects objects?"
> **Winning Answer**:  
> *"YOLO detects objects on individual frames in isolation — it has no memory of past frames. If a person appears on Frame 1 and Frame 2, YOLO doesn't know it's the same person.  
> ByteTrack uses **Kalman Filtering** to predict object movement trajectories across consecutive frames and assigns a persistent `track_id` (e.g. Person #4). This prevents duplicate alert logs and eliminates bounding box flickering."*

---

### Q8: "How does multi-threading work in `camera_manager.py`?"
> **Winning Answer**:  
> *"Standard OpenCV `cv2.VideoCapture.read()` is a blocking operation. If network delay occurs on an IP camera stream, the entire Python process freezes.  
> We implemented a background daemon thread in `CameraManager` that continuously reads frames into a thread-safe single-item buffer. The AI engine reads the latest frame instantly from memory without blocking."*

---

## 📌 Category 3: Node.js Backend & Database Security

### Q9: "How is user authentication secured in the backend?"
> **Winning Answer**:  
> *"We use **JWT (JSON Web Tokens)** and **Bcrypt password hashing**.  
> 1. Passwords are never saved in cleartext; they are hashed using Bcrypt with 10 salt rounds.  
> 2. On successful login, Node.js issues a signed JWT token containing user role and expiration time.  
> 3. Protected backend routes use an `auth.middleware.js` interceptor that verifies token cryptographic signatures before granting access."*

---

### Q10: "How do you prevent JSON database file corruption if power turns off during a write?"
> **Winning Answer**:  
> *"We use **Atomic File Writes**. Instead of overwriting `db.json` directly, the database service writes the new data to a temporary file (`db.json.tmp`) first. Once writing completes, it performs an atomic OS file rename `fs.renameSync()`. If power cuts mid-write, the original `db.json` remains intact."*

---

## 📌 Category 4: React Frontend & Real-Time Rendering

### Q11: "How does React render live video frames without HTML5 `<video>` tags or video player libraries?"
> **Winning Answer**:  
> *"The Python engine encodes OpenCV video frames into JPEG format and converts them into Base64 ASCII strings.  
> Over WebSocket, React receives the Base64 string payload and sets the `src` attribute of a standard HTML `<img>` tag (`data:image/jpeg;base64,...`). This achieves 30 FPS playback with zero browser media player plugin dependencies."*

---

### Q12: "How does the canvas dynamic zone drawing work?"
> **Winning Answer**:  
> *"In `ZoneEditor.jsx`, an HTML5 `<canvas>` listens for mouse click events. We calculate mouse click X/Y relative coordinates and store them in a coordinate array `[[x1,y1], [x2,y2], ...]`.  
> The canvas 2D context connects the points using `lineTo()` and fills the enclosed polygon with translucent red color. The coordinate list is saved to the backend API via `POST /api/zones` for spatial threat evaluation."*

---

## 📌 Category 5: System Scaling & Future Scope

### Q13: "How would you scale this project to support 100 IP cameras in a multi-building enterprise?"
> **Winning Answer**:  
> *"To scale to 100 cameras:  
> 1. **Message Broker**: Use **Apache Kafka** or **RabbitMQ** to queue camera frame streams across a cluster of Python worker nodes.  
> 2. **GPU Acceleration**: Deploy YOLOv8 using **NVIDIA TensorRT** on dedicated GPU servers (e.g. T4 or A100).  
> 3. **Database**: Migrate JSON file storage to **PostgreSQL** with TimescaleDB extension for high-ingest time-series telemetry storage.  
> 4. **Containerization**: Package Python engine workers into Kubernetes pods with auto-scaling based on stream load."*

---

## 💡 Quick Presentation Checklist for Demo Day
- [ ] **Step 1**: Start Node.js backend (`cd server && npm run dev`) — Runs on Port 5000.
- [ ] **Step 2**: Start Python CV engine (`cd engine && python main.py`) — Runs WS on Port 8000.
- [ ] **Step 3**: Start React frontend (`cd client && npm run dev`) — Opens at `http://localhost:5173`.
- [ ] **Step 4**: Login with `admin` credentials, show live video feed, move in front of camera to demonstrate MOG2 + YOLO detection, draw a restricted zone, and trigger the audio alert chime!
