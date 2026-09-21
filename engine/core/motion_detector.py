"""
MOG2 Motion Detector Module.
Acts as Stage 1 (Fast Gatekeeper) in the dual-pipeline design.
Uses OpenCV MOG2 (Mixture of Gaussians v2) background subtraction to detect scene changes.
Bypasses heavy YOLO inference when no motion is present, drastically optimizing resource usage.
"""
import cv2
import numpy as np
import logging

logger = logging.getLogger("SurveillanceEngine.MotionDetector")

class MotionDetector:
    def __init__(self, config):
        self.apply_config(config)
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500,
            varThreshold=16,
            detectShadows=False
        )

    def apply_config(self, config):
        self.enabled = config.get("enabled", True)
        self.sensitivity = int(config.get("sensitivity", 500))
        self.learning_rate = float(config.get("learning_rate", 0.005))
        blur_k = config.get("blur_kernel", [21, 21])
        self.blur_kernel = (int(blur_k[0]), int(blur_k[1]))

    def detect_motion(self, frame):
        if not self.enabled:
            return True, None, 0.0

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, self.blur_kernel, 0)
        fg_mask = self.bg_subtractor.apply(blurred, learningRate=self.learning_rate)

        cleaned_mask = cv2.erode(fg_mask, None, iterations=1)
        cleaned_mask = cv2.dilate(cleaned_mask, None, iterations=3)

        contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        max_area = 0.0
        has_motion = False

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > max_area:
                max_area = area
            if area >= self.sensitivity:
                has_motion = True

        return has_motion, cleaned_mask, max_area
