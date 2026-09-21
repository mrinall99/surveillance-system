"""
Frame Processor Pipeline Orchestrator.
Combines Camera Capture -> MOG2 Gatekeeper -> YOLOv8 Detection -> ByteTrack -> Visual Overlay Annotation -> Base64 Encoding.
"""
import cv2
import base64
import time
import logging
import numpy as np

logger = logging.getLogger("SurveillanceEngine.FrameProcessor")

class FrameProcessor:
    def __init__(self, config, detector, tracker, motion_detector):
        self.config = config
        self.detector = detector
        self.tracker = tracker
        self.motion_detector = motion_detector

    def process_frame(self, camera_id, frame):
        """
        Executes full dual-pipeline processing on input frame.
        Returns:
            annotated_frame (np.ndarray): Visual frame with bounding boxes.
            jpeg_base64 (str): Base64 encoded JPEG string for streaming.
            payload (dict): Structured frame metadata and detections list.
        """
        start_time = time.time()

        # Step 1: MOG2 Motion Pre-Filter (Fast Gate)
        has_motion, motion_mask, motion_area = self.motion_detector.detect_motion(frame)

        detections = []
        if has_motion:
            # Step 2 & 3: YOLOv8 Inference + ByteTrack Multi-Object Tracking
            if self.tracker and self.config.get("tracking", {}).get("enabled", True):
                detections = self.tracker.track(frame)
            else:
                detections = self.detector.detect(frame)

        # Step 4: Draw Visual Annotations on Frame
        annotated_frame = frame.copy()
        self._annotate_frame(annotated_frame, detections, has_motion)

        # Calculate processing latency (ms)
        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        # Step 5: Encode annotated frame to JPEG -> Base64 string for WebSocket transfer
        _, buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        jpeg_base64 = base64.b64encode(buffer).decode('utf-8')

        # Build frame metadata package
        payload = {
            "camera_id": camera_id,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "has_motion": has_motion,
            "motion_area": float(motion_area),
            "detections": detections,
            "inference_time_ms": inference_time_ms
        }

        return annotated_frame, jpeg_base64, payload

    def _annotate_frame(self, frame, detections, has_motion):
        """Draws bounding boxes, labels, and status bar on frame."""
        # Color palette for classes (BGR)
        colors = {
            "person": (0, 0, 255),      # Red
            "car": (255, 165, 0),       # Orange
            "motorcycle": (255, 255, 0),# Yellow
            "dog": (0, 255, 0),         # Green
            "cat": (0, 255, 255),       # Cyan
            "default": (255, 0, 255)    # Magenta
        }

        for det in detections:
            bbox = det["bbox"]
            cls_name = det["class"]
            conf = det["confidence"]
            track_id = det.get("track_id", -1)

            x1, y1, x2, y2 = bbox
            color = colors.get(cls_name, colors["default"])

            # Draw bounding box rectangle
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            # Format label string: "person #1 (92%)"
            if track_id != -1:
                label = f"{cls_name} #{track_id} ({int(conf * 100)}%)"
            else:
                label = f"{cls_name} ({int(conf * 100)}%)"

            # Draw label background box
            (text_w, text_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(frame, (x1, y1 - text_h - 6), (x1 + text_w + 6, y1), color, -1)
            cv2.putText(frame, label, (x1 + 3, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        # Top Status Overlay Bar
        status_text = "MOTION DETECTED" if has_motion else "SCANNING..."
        status_color = (0, 0, 255) if has_motion else (0, 255, 0)
        cv2.putText(frame, f"STATUS: {status_text} | OBJECTS: {len(detections)}", 
                    (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
