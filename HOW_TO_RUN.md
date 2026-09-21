# 🚀 How to Start the Surveillance System (Startup Guide)

This guide contains the exact commands and startup order to run the 3 tiers of the surveillance system:
1. **Python AI CV Engine** (Computer Vision, YOLOv8, CUDA RTX 2050, Port `8765`)
2. **Node.js Backend Server** (Threat Intelligence, Database, REST API, Port `5000`)
3. **React Frontend Command Center** (Dashboard, Live 30 FPS Stream, Port `3000`)

---

## ⚡ Option 1: 1-Click Automated Startup (Recommended)

Run the automated launcher script from the root folder in PowerShell or Command Prompt:

```powershell
.\start_all.bat
```

*This automatically launches all 3 services in separate terminal windows and opens your browser.*

---

## 🛠️ Option 2: Manual Terminal Startup (Step-by-Step)

Open **3 separate terminal windows** (PowerShell or Command Prompt) and run the commands in the order shown below:

---

### 🔹 Terminal 1: Start the Python AI Engine

The engine accesses your webcam, runs YOLOv8 object detection on your NVIDIA GPU, and streams frames over WebSockets.

```powershell
cd "c:\Users\mrina\Documents\surveillance system\engine"
python main.py
```

**✅ Expected Terminal Output:**
```text
🔥 Hardware Acceleration Active: NVIDIA GPU Detected (NVIDIA GeForce RTX 2050)
Loading YOLOv8 Model: yolov8s.pt on device: cuda:0
🚀 Python CV Engine WebSocket Server running on ws://0.0.0.0:8765
📹 Camera Initialized: Primary Webcam (640x480 @ 30 FPS)
```

---

### 🔹 Terminal 2: Start the Node.js Backend Server

The backend receives frames from the Python engine, evaluates spatial polygon zones and threat levels, and serves REST API & Socket.IO.

```powershell
cd "c:\Users\mrina\Documents\surveillance system\server"
npm start
```

**✅ Expected Terminal Output:**
```text
✅ Embedded Database Connected & Initialized (JSON Persistence)
Connecting to Python CV Engine at ws://127.0.0.1:8765...
==================================================
🟢 SURVEILLANCE BACKEND RUNNING ON http://localhost:5000
📡 CORS ALLOWED ORIGIN: http://localhost:3000
==================================================
🟢 Connected to Python CV Engine via WebSocket
```

---

### 🔹 Terminal 3: Start the React Frontend Command Center

The web dashboard displays the real-time video feed, glowing polygon zone overlays, threat alerts, and voice alarm (`jaldi.mp3`).

```powershell
cd "c:\Users\mrina\Documents\surveillance system\client"
npm run dev
```

**✅ Expected Terminal Output:**
```text
  VITE v5.4.21  ready in 320 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## 🌐 Accessing the Application

Once all 3 terminals are running, open your web browser:

👉 **URL:** [http://localhost:3000](http://localhost:3000)

* **If first time or logged out:** Log in with your admin username (e.g., `hitman009`) or initialize via `/setup`.
* **Live Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
* **Interactive Zone Editor:** [http://localhost:3000/cameras](http://localhost:3000/cameras)
* **System Settings:** [http://localhost:3000/settings](http://localhost:3000/settings)

---

## 🛑 How to Stop the System

To cleanly stop any service:
* Click inside each terminal window and press **`Ctrl + C`**.

---

## 🔧 Troubleshooting Quick Reference

### Issue: `Error: listen EADDRINUSE: address already in use :::5000`
**Cause:** An old instance of the Node backend is still running in the background.  
**Fix:** Run this command in PowerShell to free port 5000:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

### Issue: Camera doesn't open in Python engine
**Cause:** Another application (like Zoom, Teams, or the Windows Camera app) is using your webcam.  
**Fix:** Close any other app using the webcam and restart `python main.py`.

### Issue: No audio when entering restricted zones
**Cause:** Modern browsers require one user click on the page to enable audio playback.  
**Fix:** Click anywhere on the dashboard or click the **`TEST JALDI AUDIO`** button on the toolbar to unlock browser audio.
