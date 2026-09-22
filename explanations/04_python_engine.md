# 🐍 Python CV Engine Explanation
# Folder: `engine/`

---

## Entry Point: `main.py`

This is what you run first: `python main.py`

```python
import asyncio       # Lets Python do multiple things at once (async)
import logging       # For printing timestamped log messages
import sys, os

# Add the parent folder to Python's search path so imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.config import load_config             # reads config.yaml
from engine.core.camera_manager import CameraManager    # opens webcam
from engine.core.object_detector import ObjectDetector  # YOLOv8
from engine.core.tracker import MultiObjectTracker      # ByteTrack
from engine.core.frame_processor import FrameProcessor  # draws + encodes
from engine.server.ws_server import EngineWebSocketServer  # sends to Node.js
```

### `setup_logging()` function:
```python
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,   # Show INFO and above (not DEBUG)
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        # ↑ Output looks like: "2026-09-22 10:30:01 [INFO] Engine: Starting..."
        handlers=[logging.StreamHandler(sys.stdout)]
        # ↑ Print to the terminal window
    )
```

### `main_loop()` — the async main function:

```python
async def main_loop():
    setup_logging()
    config = load_config()   # reads config.yaml → returns a Python dict

    # 1. Setup camera
    camera_configs = config.get("cameras", [])
    camera_mgr = CameraManager(camera_configs)
    # CameraManager opens cv2.VideoCapture for each configured camera

    # 2. Setup YOLO detector
    detection_cfg = config.get("detection", {})
    detector = ObjectDetector(detection_cfg)
    # Loads YOLOv8 model file (yolov8s.pt) into memory / GPU

    # 3. Setup ByteTrack tracker
    tracking_cfg = config.get("tracking", {})
    tracker = MultiObjectTracker(tracking_cfg, detector)
    # ByteTrack wraps YOLO and adds persistent IDs per object

    # 4. Setup frame processor
    processor = FrameProcessor(config, detector, tracker)
    # Will call tracker.track() or detector.detect() per frame

    # 5. Live config update callback
    def on_live_config_update(new_config):
        # Called when Node.js sends UPDATE_CONFIG message
        # e.g. user moved the confidence threshold slider in the UI
        if "detection" in new_config:
            detector.apply_config(new_config["detection"])

    # 6. Start WebSocket server (port 8765)
    ws_server = EngineWebSocketServer(
        host="0.0.0.0",
        port=8765,
        config_callback=on_live_config_update
    )
    await ws_server.start()
    # Now listening for Node.js to connect

    # 7. Main capture loop
    primary_cam = camera_mgr.get_camera(1)   # Get webcam #1
    while True:
        if primary_cam:
            success, frame = primary_cam.read_frame()
            # success = True/False, frame = raw numpy array (image pixels)

            if success and frame is not None:
                # Run full pipeline on this frame
                annotated_frame, frame_base64, payload = processor.process_frame(
                    camera_id=primary_cam.camera_id,
                    frame=frame
                )
                # Send to all connected Node.js clients
                await ws_server.broadcast_frame(frame_base64, payload)

        await asyncio.sleep(0.001)
        # ↑ Yields control briefly so the WebSocket server can run
        # Without this, the while loop would block everything

if __name__ == "__main__":
    asyncio.run(main_loop())
    # asyncio.run() starts the event loop and runs main_loop() inside it
```

---

## `config.py` — Configuration Loader

```python
import yaml

def load_config(config_path=None):
    if config_path is None:
        # Default: go two levels up from engine/ to find config.yaml
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(base_dir, "config.yaml")

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
        # Reads the YAML file and converts it into a Python dictionary
        # e.g. config["detection"]["confidence_threshold"] → 0.5

    return config
```

---

## `core/camera_manager.py` — Webcam Handler

### `CameraStream` class — one camera source:

```python
class CameraStream:
    def __init__(self, camera_id=1, name="Primary", source=0, resolution=(640,480), fps=25):
        self.camera_id = camera_id   # Internal ID used by the engine
        self.source = source         # 0 = default webcam, or RTSP URL string
        self.target_resolution = resolution  # (width, height) in pixels
        self.cap = None              # Will hold the OpenCV VideoCapture object
        self._connect()              # Open the webcam immediately

    def _connect(self):
        # If source is a string like "0", convert to integer
        if isinstance(source_val, str) and source_val.isdigit():
            source_val = int(source_val)

        # OpenCV's VideoCapture opens the webcam
        self.cap = cv2.VideoCapture(source_val)

        # Set the resolution and FPS in the webcam hardware
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.target_resolution[0])
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.target_resolution[1])
        self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        self.is_connected = self.cap.isOpened()
        # isOpened() returns True if the webcam was successfully opened

    def read_frame(self):
        # Read the next frame from the webcam
        ret, frame = self.cap.read()
        # ret = True if successful
        # frame = numpy array of shape (height, width, 3) — BGR pixel values

        if not ret or frame is None:
            self.is_connected = False
            return False, None

        # Resize if the frame is not the target resolution
        if (frame.shape[1], frame.shape[0]) != self.target_resolution:
            frame = cv2.resize(frame, self.target_resolution)

        return True, frame
```

### `CameraManager` class — manages multiple cameras:
```python
class CameraManager:
    def __init__(self, camera_configs):
        self.cameras = {}  # dict: { camera_id: CameraStream }

        # If no cameras configured → create a default webcam entry
        if not camera_configs:
            camera_configs = [{"id": 1, "source": 0, "resolution": [640, 480], "fps": 25}]

        # Create one CameraStream per camera in config
        for cam_cfg in camera_configs:
            cam_id = cam_cfg.get("id", 1)
            self.cameras[cam_id] = CameraStream(...)

    def get_camera(self, camera_id=1):
        # Return the camera with the given ID
        # If not found, return the first available camera
        return self.cameras.get(camera_id) or list(self.cameras.values())[0]

    def release_all(self):
        # Called on shutdown — properly closes all webcam connections
        for cam in self.cameras.values():
            cam.release()
```

---

## `core/object_detector.py` — YOLOv8 Inference

```python
import torch
from ultralytics import YOLO

class ObjectDetector:
    def __init__(self, config):
        model_name = config.get("model", "yolov8s.pt")
        # "yolov8s.pt" = YOLOv8 Small — balance of speed and accuracy
        # Other options: yolov8n.pt (nano, fastest), yolov8m.pt (medium, slower)

        # Auto-detect if NVIDIA GPU is available
        if device_req == "auto":
            if torch.cuda.is_available():
                self.device = "cuda:0"   # Use first GPU
                gpu_name = torch.cuda.get_device_name(0)
                logger.info(f"GPU Active: {gpu_name}")
            else:
                self.device = "cpu"      # Fall back to CPU (slower)

        # Load the YOLO model file and move it to the selected device
        self.model = YOLO(model_name)
        self.model.to(self.device)
        self.class_names = self.model.names
        # class_names is a dict: { 0: 'person', 1: 'bicycle', 2: 'car', ... }
        # COCO dataset has 80 classes

    def apply_config(self, config):
        # Called when user changes settings from the React UI
        self.conf_threshold = float(config.get("confidence_threshold", 0.5))
        # confidence_threshold: 0.0 to 1.0
        # 0.5 means "only report detections the model is ≥50% confident about"
        self.iou_threshold = float(config.get("iou_threshold", 0.45))
        # iou_threshold: controls how much bounding boxes can overlap
        self.target_classes = config.get("target_classes", ["person", "car", ...])

    def detect(self, frame):
        # Run YOLO inference on a single frame
        results = self.model.predict(
            source=frame,             # numpy array (the image)
            device=self.device,       # "cuda:0" or "cpu"
            conf=self.conf_threshold, # minimum confidence to report
            iou=self.iou_threshold,   # overlap threshold for NMS
            verbose=False             # don't print to terminal every frame
        )
        # results[0] = predictions for the first (and only) image

        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0].item())        # class index (e.g. 0)
            class_name = self.class_names[cls_id]  # e.g. "person"

            # Skip if this class is not in our target list
            if class_name not in self.target_classes:
                continue

            confidence = float(box.conf[0].item()) # e.g. 0.9245

            # xyxy = [x1, y1, x2, y2] in pixel coordinates
            xyxy = box.xyxy[0].tolist()

            detections.append({
                "class": class_name,      # "person"
                "confidence": round(confidence, 4),  # 0.9245
                "bbox": [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
                # e.g. [120, 45, 280, 390]
            })

        return detections
```

---

## `core/tracker.py` — ByteTrack Multi-Object Tracking

Regular YOLO gives a new detection every frame, but doesn't know if
"the person detected now" is the same person from last frame.

ByteTrack solves this — it assigns a **persistent ID** to each object.

```python
class MultiObjectTracker:
    def __init__(self, config, detector_model):
        self.model = detector_model.model
        # ByteTrack uses the SAME YOLO model as the detector
        # but calls model.track() instead of model.predict()

    def track(self, frame):
        results = self.model.track(
            source=frame,
            persist=True,                        # ← KEY: remember IDs between frames
            tracker="bytetrack.yaml",            # tracker algorithm config
            device=self.device,
            verbose=False
        )

        for box in results[0].boxes:
            # Same as detect() but with one extra field:
            track_id = int(box.id[0].item()) if box.id is not None else -1
            # track_id = -1 means tracking failed for this object

            tracked_objects.append({
                "track_id": track_id,    # e.g. 3 (Person #3)
                "class": class_name,     # "person"
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2]
            })
```

**Why this matters for threat analysis:**
- ByteTrack gives Person #3 the same `track_id=3` across many frames
- ThreatService can then track: "Person #3 has been in the monitored zone for 45 seconds"
- This is how **loitering detection** works

---

## `core/frame_processor.py` — Annotate + Encode

```python
class FrameProcessor:
    def __init__(self, config, detector, tracker):
        self.config = config
        self.detector = detector
        self.tracker = tracker

    def process_frame(self, camera_id, frame):
        start_time = time.time()

        # Step 1: Run tracking OR plain detection
        if self.tracker and config["tracking"]["enabled"]:
            detections = self.tracker.track(frame)
            # Returns: [{ track_id, class, confidence, bbox }, ...]
        else:
            detections = self.detector.detect(frame)
            # Returns: [{ class, confidence, bbox }, ...]

        # Step 2: Draw bounding boxes on a copy of the frame
        annotated_frame = frame.copy()
        self._annotate_frame(annotated_frame, detections)

        # Step 3: Calculate how long detection took
        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        # Step 4: Encode the annotated frame to JPEG → Base64 string
        _, buffer = cv2.imencode('.jpg', annotated_frame,
                                  [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        # JPEG quality 80 = good quality, smaller file size
        jpeg_base64 = base64.b64encode(buffer).decode('utf-8')
        # base64.b64encode: converts binary bytes → text string
        # .decode('utf-8'): makes it a regular Python string (not bytes)

        # Step 5: Build the payload dictionary
        payload = {
            "camera_id": camera_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "has_motion": len(detections) > 0,
            "detections": detections,
            "inference_time_ms": inference_time_ms
        }

        return annotated_frame, jpeg_base64, payload

    def _annotate_frame(self, frame, detections):
        colors = {
            "person":     (0, 0, 255),    # Red in BGR format
            "car":        (255, 165, 0),  # Orange
            "motorcycle": (255, 255, 0),  # Yellow
            "dog":        (0, 255, 0),    # Green
            "cat":        (0, 255, 255),  # Cyan
            "default":    (255, 0, 255)   # Magenta (for unknown classes)
        }

        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cls_name = det["class"]
            conf = det["confidence"]
            track_id = det.get("track_id", -1)
            color = colors.get(cls_name, colors["default"])

            # Draw the rectangle bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            # (x1,y1) = top-left corner, (x2,y2) = bottom-right corner
            # 2 = line thickness in pixels

            # Build label string
            if track_id != -1:
                label = f"{cls_name} #{track_id} ({int(conf * 100)}%)"
                # e.g. "person #3 (92%)"
            else:
                label = f"{cls_name} ({int(conf * 100)}%)"
                # e.g. "car (87%)"

            # Draw filled rectangle behind the label (so text is readable)
            (text_w, text_h), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(frame,
                (x1, y1 - text_h - 6),   # top-left of label box
                (x1 + text_w + 6, y1),   # bottom-right of label box
                color, -1                 # -1 = filled rectangle
            )

            # Draw the label text on top of the colored rectangle
            cv2.putText(frame, label, (x1 + 3, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                        (255, 255, 255),  # white text
                        1)               # 1 = text thickness

        # Draw status bar at the top of the entire frame
        status_text = "MOTION DETECTED" if detections else "SCANNING..."
        status_color = (0, 0, 255) if detections else (0, 255, 0)
        cv2.putText(frame,
            f"STATUS: {status_text} | OBJECTS: {len(detections)}",
            (10, 25),                   # position (x=10, y=25 pixels from top)
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,                        # font scale
            status_color,
            2)                          # thickness
```

---

## `server/ws_server.py` — WebSocket Server

```python
class EngineWebSocketServer:
    def __init__(self, host, port, config_callback):
        self.clients = set()
        # ↑ A set of all currently connected Node.js clients
        # Usually just 1 client (the Node.js server)
        self.config_callback = config_callback
        # ↑ Function to call when Node.js sends a settings update

    async def handler(self, websocket, *args):
        # Called every time a new client connects
        self.clients.add(websocket)   # Add to set

        async for message in websocket:
            # Wait for incoming messages from Node.js
            data = json.loads(message)

            if data.get("type") == "UPDATE_CONFIG":
                # Node.js sent new settings from the React UI
                self.config_callback(data.get("config", {}))
                # This calls on_live_config_update() in main.py

        self.clients.discard(websocket)  # Remove on disconnect

    async def broadcast_frame(self, frame_base64, payload):
        # Called ~30 times per second by main.py
        message_data = json.dumps({
            "type": "FRAME_DATA",
            "frame": frame_base64,   # the Base64 JPEG string
            "payload": payload       # detection metadata
        })

        # Send to ALL connected clients simultaneously
        for client in list(self.clients):
            try:
                await client.send(message_data)
            except websockets.exceptions.ConnectionClosed:
                self.clients.discard(client)  # Remove disconnected client

    async def start(self):
        # Start the WebSocket server
        self.server = await websockets.serve(self.handler, self.host, self.port)
        # Now Node.js can connect to ws://0.0.0.0:8765
```
