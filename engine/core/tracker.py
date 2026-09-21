"""
ByteTrack Multi-Object Tracker Module.
Assigns persistent unique Track IDs (e.g. Person #1, Car #14) to objects across consecutive frames.
Enables loitering duration analysis and entry/exit count tracking.
"""
import torch
import logging
from ultralytics import YOLO

logger = logging.getLogger("SurveillanceEngine.Tracker")

class MultiObjectTracker:
    def __init__(self, config, detector_model):
        self.enabled = config.get("enabled", True)
        self.algorithm = config.get("algorithm", "bytetrack")
        self.max_age = config.get("max_age", 30)
        self.loiter_thresh = config.get("loiter_threshold_seconds", 300)
        self.model = detector_model.model
        self.device = detector_model.device
        self.target_classes = config.get("target_classes", ["person", "car", "motorcycle", "dog", "cat"])
        self.class_names = detector_model.class_names

    def track(self, frame):
        """
        Runs tracking pipeline on the frame.
        Returns list of dicts with persistent track_id included:
            [
                {
                    "track_id": int,
                    "class": str,
                    "confidence": float,
                    "bbox": [x1, y1, x2, y2]
                }, ...
            ]
        """
        if not self.enabled:
            return []

        # Run YOLO with ByteTrack tracker mode
        results = self.model.track(
            source=frame,
            persist=True,
            tracker=f"{self.algorithm}.yaml",
            device=self.device,
            verbose=False
        )

        tracked_objects = []
        if not results or len(results) == 0:
            return tracked_objects

        boxes = results[0].boxes
        if boxes is None or len(boxes) == 0:
            return tracked_objects

        for box in boxes:
            cls_id = int(box.cls[0].item())
            class_name = self.class_names.get(cls_id, f"class_{cls_id}")

            if self.target_classes and class_name not in self.target_classes:
                continue

            confidence = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()

            # Track ID assigned by ByteTrack algorithm
            track_id = int(box.id[0].item()) if box.id is not None else -1

            tracked_objects.append({
                "track_id": track_id,
                "class": class_name,
                "confidence": round(confidence, 4),
                "bbox": [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
            })

        return tracked_objects
