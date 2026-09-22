# 💻 07. Exact Code Line-by-Line Logic Mapping

---

## 🎯 Purpose of this Document
In a Viva or technical presentation, examiners often point at a specific function in your code and ask:  
*"What does this line do? Why did you write it like this?"*

This document bridges the gap between **high-level logic** and **actual lines of code** from your workspace.

---

## 1. Stage 1: Motion Detector Logic (`engine/core/motion_detector.py`)

### 📄 Code Snippet:
```python
16:  self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
17:      history=500,
18:      varThreshold=16,
19:      detectShadows=False
20:  )
```
- **Line 16-20 Logic**: Initializes OpenCV's MOG2 (Mixture of Gaussians v2) algorithm.
  - `history=500`: Keeps a rolling history of the last 500 frames to construct the static background model.
  - `varThreshold=16`: Sets the Mahalanobis variance threshold for pixel difference classification.
  - `detectShadows=False`: Disables shadow detection to speed up processing by 2x.

```python
33:  gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
34:  blurred = cv2.GaussianBlur(gray, self.blur_kernel, 0)
35:  fg_mask = self.bg_subtractor.apply(blurred, learningRate=self.learning_rate)
```
- **Line 33**: Converts 3-channel BGR image into 1-channel Grayscale to reduce memory channels by 66%.
- **Line 34**: Applies Gaussian Blur filter to smooth high-frequency image noise (like rain or camera sensor noise).
- **Line 35**: Computes foreground binary mask (`255` = moving pixel, `0` = static pixel).

```python
37:  cleaned_mask = cv2.erode(fg_mask, None, iterations=1)
38:  cleaned_mask = cv2.dilate(cleaned_mask, None, iterations=3)
```
- **Line 37-38 (Morphological Operations)**: 
  - `erode`: Removes tiny floating noise dots.
  - `dilate`: Expands and fills gaps inside true moving objects.

```python
45:  for cnt in contours:
46:      area = cv2.contourArea(cnt)
...
49:      if area >= self.sensitivity:
50:          has_motion = True
```
- **Line 45-50**: Calculates white pixel contour surface area. If area exceeds sensitivity threshold (e.g., 500 pixels), `has_motion` flag returns `True`.

---

## 2. Stage 2: YOLOv8 Object Detector Logic (`engine/core/object_detector.py`)

### 📄 Code Snippet:
```python
20:  if torch.cuda.is_available():
21:      self.device = "cuda:0"
22:      logger.info(f"🔥 Hardware Acceleration Active: NVIDIA GPU Detected")
23:  else:
24:      self.device = "cpu"
```
- **Line 20-24 Logic**: Auto-detects hardware. If an NVIDIA GPU with CUDA drivers is present, inference runs on GPU (`cuda:0`). Otherwise, gracefully falls back to CPU execution.

```python
41:  results = self.model.predict(
42:      source=frame,
43:      device=self.device,
44:      conf=self.conf_threshold,
45:      iou=self.iou_threshold,
46:      verbose=False
47:  )
```
- **Line 41-47 Logic**: Runs YOLOv8 forward pass prediction on the input image matrix.
  - `conf=0.5`: Filters out any prediction with confidence < 50%.
  - `iou=0.45`: Applies Non-Maximum Suppression (NMS) to remove overlapping bounding boxes.

```python
63:  if self.target_classes and class_name not in self.target_classes:
64:      continue
```
- **Line 63-64 Logic**: Filters detected objects against allowed target class list (`['person', 'car', 'motorcycle', 'dog', 'cat']`), ignoring irrelevant items like chairs, tables, or cups.

---

## 3. Frame Processor Pipeline Logic (`engine/core/frame_processor.py`)

### 📄 Code Snippet:
```python
31:  has_motion, motion_mask, motion_area = self.motion_detector.detect_motion(frame)
32:  
33:  detections = []
34:  if has_motion:
35:      if self.tracker and self.config.get("tracking", {}).get("enabled", True):
36:          detections = self.tracker.track(frame)
37:      else:
38:          detections = self.detector.detect(frame)
```
- **Line 31-38 (Dual-Stage Gating Logic)**:
  - If `has_motion` is `False`, YOLO inference is **completely bypassed** (`detections = []`).
  - If `has_motion` is `True`, ByteTrack / YOLO is invoked.

```python
49:  _, buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
50:  jpeg_base64 = base64.b64encode(buffer).decode('utf-8')
```
- **Line 49-50 (JPEG & Base64 Encoding)**:
  - Line 49 encodes annotated OpenCV NumPy image matrix into compressed binary JPEG format (80% quality).
  - Line 50 converts binary JPEG buffer to Base64 ASCII string so it can be streamed cleanly across WebSockets to the web browser.

---

## 4. Embedded Database Logic (`server/src/db/database.js`)

### 📄 Code Snippet:
```python
27:  if (fs.existsSync(dbPath)) {
28:      try {
29:          const raw = fs.readFileSync(dbPath, 'utf8');
30:          dbData = JSON.parse(raw);
31:      } catch (e) { ... }
32:  }
```
- **Line 27-32 (Database Loading)**: Reads `data/surveillance.json` from disk into RAM memory on server startup, converting JSON strings into native JavaScript objects.

```python
60:  function saveToDisk() {
61:      try {
62:          const tempPath = dbPath + '.tmp';
63:          fs.writeFileSync(tempPath, JSON.stringify(dbData, null, 2), 'utf8');
64:          fs.renameSync(tempPath, dbPath);
65:      } catch (err) { ... }
66:  }
```
- **Line 60-66 (Atomic Disk Persistence)**:
  - Line 63 writes payload to temporary file `surveillance.json.tmp`.
  - Line 64 renames temporary file to `surveillance.json` using atomic OS rename `fs.renameSync()`. This guarantees **zero database corruption** during power failures.

---

## 5. Security & Authentication Middleware (`server/src/middleware/auth.middleware.js`)

### 📄 Code Snippet:
```javascript
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
}

const token = authHeader.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
req.user = decoded;
next();
```
- **Line-by-Line Logic**:
  1. `req.headers.authorization`: Extracts Authorization HTTP header.
  2. `startsWith('Bearer ')`: Checks if header follows RFC 6750 Bearer token format.
  3. `jwt.verify()`: Validates cryptographic signature using secret key. If token was tampered with or expired, throws an exception and halts execution.
  4. `req.user = decoded`: Attaches authenticated user payload to request context.
  5. `next()`: Hands over execution to controller handler.
