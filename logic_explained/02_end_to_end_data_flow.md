# 🔄 02. End-to-End System Data Flow & Connections

---

## The Complete Lifecycle of a Single Video Frame

Below is the step-by-step trace of how a frame moves through the system, from physical webcam/RTSP capture all the way to a rendered bounding box and warning chime on the React web UI.

```
 [ Webcam / RTSP ]
        │ (Raw BGR NumPy array via OpenCV VideoCapture)
        ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. PYTHON CV ENGINE (engine/main.py)                    │
 │    - CameraManager reads raw frame                     │
 │    - MotionDetector checks pixel difference (MOG2)     │
 │    - ObjectDetector invokes YOLOv8 (Person, Car, etc.) │
 │    - Tracker tracks trajectory (ByteTrack IDs)         │
 │    - FrameProcessor draws Bounding Boxes & Text overlay│
 │    - OpenCV encodes frame to JPEG -> Base64 string     │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            │ (WebSocket Push: frame & detection payload)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. PYTHON WEBSOCKET SERVER (engine/server/ws_server.py) │
 │    - Broadcasts Base64 JPEG frame to connected clients │
 │    - Checks if any threat detected                     │
 └──────────────────────────┬─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ (HTTP POST Alert Payload)      │ (Direct WS Frame Stream)
            ▼                                ▼
 ┌───────────────────────────┐    ┌───────────────────────────┐
 │ 3. NODE.JS BACKEND        │    │ 4. REACT FRONTEND         │
 │    - Threat Service       │    │    - WS Hook receives     │
 │    - Inserts event to JSON│    │      Base64 image string  │
 │    - Updates Threat Stats │    │    - Updates <img> source │
 └───────────────────────────┘    │    - Plays audio alert if │
                                  │      threat level HIGH    │
                                  └───────────────────────────┘
```

---

## Detailed Step-by-Step Step Breakdown

### Step 1: Camera Frame Acquisition (Python)
- `CameraManager` opens OpenCV camera handle `cv2.VideoCapture(source)`.
- It captures a frame matrix of shape `(720, 1280, 3)` representing Height, Width, RGB Color channels.

### Step 2: Gating & Motion Pre-Filtering
- Frame is passed to `MotionDetector` (`cv2.createBackgroundSubtractorMOG2()`).
- Output: A binary mask (white pixels = motion, black = static).
- If white motion pixel area < minimum contour area, motion flag is `False`.

### Step 3: Deep Learning Object Detection (YOLOv8)
- If motion is `True`, the matrix is passed into `YOLOv8s.pt`.
- YOLO evaluates tensor features and returns predicted bounding boxes:
  - `[x1, y1, x2, y2, confidence, class_id]`
  - Example: `[150, 200, 310, 580, 0.92, 0]` -> `0` represents "person" with 92% confidence.

### Step 4: Multi-Object Tracking (ByteTrack)
- Raw detections are passed to `Tracker`.
- ByteTrack assigns persistent IDs (e.g., `Person #1`, `Person #2`) across consecutive frames using Kalman Filtering and Hungarian matching algorithm.
- This ensures an object doesn't flicker or get duplicate alert logs every 30ms.

### Step 5: Frame Annotation & Base64 Encoding
- `cv2.rectangle()` draws bounding box rectangles on the frame array.
- `cv2.putText()` labels the box with object class, ID, and confidence score.
- `cv2.imencode('.jpg', frame)` converts NumPy matrix to compressed JPEG memory buffer.
- `base64.b64encode()` converts binary JPEG buffer to a clean ASCII string suitable for WebSocket streaming.

### Step 6: WebSocket Streaming & Frontend Rendering
- `ws_server.py` broadcasts JSON over WebSocket:
  ```json
  {
    "type": "frame",
    "camera_id": 1,
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "detections": [
      { "id": 1, "class": "person", "confidence": 0.92, "bbox": [150, 200, 310, 580] }
    ]
  }
  ```
- React Frontend's WebSocket handler updates component state `setFrameImage(payload.image)`.
- The HTML `<img>` element updates instantly, delivering 30 FPS live video directly inside the web dashboard.

### Step 7: Alert Trigger & Backend Persistence
- If a detected object breaches a zone or is classified as a critical threat, Python engine dispatches an HTTP POST request to `http://localhost:5000/api/threats`.
- Node.js backend receives payload, writes it to `server/src/db/db.json` atomically, and broadcasts an alert update.
- React plays an alert chime sound via standard HTML Audio API (`audio.play()`) and flashes a red banner on the UI.
