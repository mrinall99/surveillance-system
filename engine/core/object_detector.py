"""
YOLOv8 Object Detector Module.
Handles deep learning inference powered by Ultralytics YOLOv8.
Utilizes CUDA GPU acceleration (e.g., NVIDIA RTX 2050) when available.
Filters target classes (persons, vehicles, animals, bags) and confidence scores.
"""
import torch
import logging
from ultralytics import YOLO

logger = logging.getLogger("SurveillanceEngine.ObjectDetector")

class ObjectDetector:
    def __init__(self, config):
        model_name = config.get("model", "yolov8s.pt")
        self.apply_config(config)
        device_req = config.get("device", "auto")

        if device_req == "auto":
            if torch.cuda.is_available():
                self.device = "cuda:0"
                gpu_name = torch.cuda.get_device_name(0)
                logger.info(f"🔥 Hardware Acceleration Active: NVIDIA GPU Detected ({gpu_name})")
            else:
                self.device = "cpu"
                logger.warning("⚠️ No CUDA GPU detected. Running YOLOv8 on CPU.")
        else:
            self.device = device_req

        logger.info(f"Loading YOLOv8 Model: {model_name} on device: {self.device}")
        self.model = YOLO(model_name)
        self.model.to(self.device)
        self.class_names = self.model.names

    def apply_config(self, config):
        self.conf_threshold = float(config.get("confidence_threshold", 0.5))
        self.iou_threshold = float(config.get("iou_threshold", 0.45))
        self.target_classes = config.get("target_classes", ["person", "car", "motorcycle", "dog", "cat"])

    def detect(self, frame):
        results = self.model.predict(
            source=frame,
            device=self.device,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False
        )

        detections = []
        if len(results) == 0:
            return detections

        result = results[0]
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            return detections

        for box in boxes:
            cls_id = int(box.cls[0].item())
            class_name = self.class_names.get(cls_id, f"class_{cls_id}")

            if self.target_classes and class_name not in self.target_classes:
                continue

            confidence = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()

            detections.append({
                "class": class_name,
                "confidence": round(confidence, 4),
                "bbox": [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
            })

        return detections
