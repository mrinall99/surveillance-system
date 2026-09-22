# 🐍 03. Python Computer Vision Engine — Deep Logic Breakdown

---

## 1. Computer Vision Architecture Overview

The Python CV Engine located in `engine/` is the intelligence core of the system. It handles image matrix processing, computer vision algorithms, deep learning inference, and frame broadcasting.

```
                  ┌───────────────────────────────┐
                  │    CameraManager (OpenCV)     │
                  └──────────────┬────────────────┘
                                 │ Frame Matrix (NumPy Array)
                                 ▼
                  ┌───────────────────────────────┐
                  │   MotionDetector (MOG2)       │
                  └──────────────┬────────────────┘
                                 │ Motion Mask & Area Check
                        ┌────────┴────────┐
                Motion? │                 │ No Motion?
                        ▼                 ▼
         ┌─────────────────────┐   ┌─────────────────────┐
         │ ObjectDetector      │   │ Skip Deep AI Pass   │
         │ (YOLOv8 PyTorch)    │   │ (Save CPU/GPU cycles)│
         └──────────┬──────────┘   └──────────┬──────────┘
                    │ Detections              │
                    ▼                         │
         ┌─────────────────────┐              │
         │ Tracker (ByteTrack) │              │
         └──────────┬──────────┘              │
                    │ Detections + Tracking ID│
                    └──────────┬──────────────┘
                               ▼
                  ┌───────────────────────────────┐
                  │ FrameProcessor Annotation     │
                  │ (Bounding Box & Text Overlay) │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │ Base64 Encoding & WS Server   │
                  └───────────────────────────────┘
```

---

## 2. Core Modules & Their Deep Logic

### A. Camera Manager (`engine/core/camera_manager.py`)
- **What it does**: Manages multi-threaded video stream acquisition from webcams (device index `0`), RTSP IP cameras, or test video files (`.mp4`).
- **Why Threading is used**: Standard OpenCV `cv2.VideoCapture.read()` is a blocking operation. If frame reading blocks for 40ms on network lag, the whole program freezes.
- **Logical Mechanics**: A background daemon thread continuously fetches frames into a single-item ring buffer. The main engine always reads the freshest frame instantly without waiting on hardware I/O.

---

### B. Motion Detector — MOG2 Background Subtraction (`engine/core/motion_detector.py`)
- **Algorithm**: Gaussian Mixture-based Background/Foreground Segmentation.
- **Mathematical Principle**: Each pixel color history is modeled as a mixture of $K$ Gaussian distributions ($K=5$). Static background pixels maintain low variance, while moving object pixels deviate sharply from the Gaussian model.
- **Contour Filtering**:
  1. `cv2.threshold()` converts grey variance into binary black & white mask.
  2. `cv2.findContours()` extracts bounding contours around white pixel clusters.
  3. `cv2.contourArea()` sums up pixel surface area.
  4. If `contour_area > min_motion_area` (e.g. 500 pixels), motion flag is triggered.

---

### C. Object Detector — YOLOv8 Neural Network (`engine/core/object_detector.py`)
- **Model**: YOLOv8 (You Only Look Once v8 by Ultralytics).
- **Why YOLOv8 over older YOLO or Faster R-CNN?**:
  - Anchor-free detection: Predicts object centers directly instead of relying on rigid predefined anchor boxes.
  - High speed: Capable of 40+ FPS on GPU, 15+ FPS on CPU.
- **Filtering Logic**:
  - **Confidence Threshold**: Any prediction below `0.45` confidence is discarded to prevent false alarms.
  - **Class Filtering**: Only relevant classes are tracked (`person`, `car`, `motorcycle`, `bus`, `truck`, `backpack`).
  - **Non-Maximum Suppression (NMS)**: Eliminates overlapping duplicate bounding boxes for the exact same object by computing Intersection over Union (IoU) between candidate boxes.

---

### D. Multi-Object Tracker — ByteTrack (`engine/core/tracker.py`)
- **Why Detection alone is not enough**: YOLO detects a person on frame 1 and frame 2, but YOLO does NOT know if the person on frame 2 is the SAME person as frame 1.
- **ByteTrack Logic**:
  - Uses **Kalman Filters** to predict where each object will move in the next frame based on velocity.
  - Computes IoU (Intersection over Union) match matrix between predicted position and actual YOLO detection box.
  - Uses **Hungarian Algorithm** for optimal assignment.
  - Result: Every person receives a persistent `track_id` (e.g., `Person #4`).

---

### E. Frame Processor & Base64 Encoder (`engine/core/frame_processor.py`)
- **Annotator**: Uses OpenCV geometric primitives `cv2.rectangle` and `cv2.putText` to draw color-coded bounding boxes (Red = Threat, Green = Normal).
- **JPEG Encoder & Base64 Conversion**:
  ```python
  _, buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
  jpeg_base64 = base64.b64encode(buffer).decode('utf-8')
  ```
- **Why Quality = 80?**: Setting JPEG compression quality to 80 reduces frame byte size by ~60% with zero noticeable visual degradation, optimizing WebSocket network bandwidth.
