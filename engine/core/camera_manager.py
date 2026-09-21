"""
Camera Manager Module.
Handles video frame capture from the primary webcam using OpenCV.
Includes automatic frame resizing and FPS control.
"""
import cv2
import time
import logging

logger = logging.getLogger("SurveillanceEngine.CameraManager")

class CameraStream:
    """
    Manages a single video source connection (Webcam or RTSP stream).
    """
    def __init__(self, camera_id=1, name="Primary Stream", source=0, resolution=(640, 480), fps=25):
        self.camera_id = camera_id
        self.name = name
        self.source = source
        self.target_resolution = tuple(resolution)
        self.target_fps = fps
        self.cap = None
        self.is_connected = False
        self.last_frame_time = 0
        self._connect()

    def _connect(self):
        """Attempts to initialize OpenCV VideoCapture for the current source."""
        logger.info(f"🎥 Connecting to Camera ID {self.camera_id} ('{self.name}') -> {self.source}")

        source_val = self.source
        if isinstance(source_val, str) and source_val.isdigit():
            source_val = int(source_val)

        if self.cap is not None and self.cap.isOpened():
            self.cap.release()

        self.cap = cv2.VideoCapture(source_val)

        if isinstance(source_val, int):
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.target_resolution[0])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.target_resolution[1])
            self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        if self.cap.isOpened():
            self.is_connected = True
            logger.info(f"✅ Successfully opened stream: {self.name} ({self.source})")
        else:
            self.is_connected = False
            logger.error(f"❌ Failed to open stream: {self.name} at source {self.source}")

    def read_frame(self):
        """
        Reads next frame from source while maintaining target FPS rate.
        Returns (success: bool, frame: np.ndarray or None)
        """
        if not self.is_connected or self.cap is None or not self.cap.isOpened():
            self._connect()
            if not self.is_connected:
                return False, None

        ret, frame = self.cap.read()

        if not ret or frame is None:
            self.is_connected = False
            return False, None

        # Resize to target resolution if needed
        if (frame.shape[1], frame.shape[0]) != self.target_resolution:
            frame = cv2.resize(frame, self.target_resolution)

        return True, frame

    def release(self):
        """Releases video capture resources."""
        if self.cap and self.cap.isOpened():
            self.cap.release()
        self.is_connected = False
        logger.info(f"Released Camera ID {self.camera_id}")


class CameraManager:
    """
    Manages CameraStream instances.
    """
    def __init__(self, camera_configs):
        self.cameras = {}
        if not camera_configs:
            camera_configs = [{"id": 1, "name": "Primary Webcam", "source": 0, "resolution": [640, 480], "fps": 25}]

        for cam_cfg in camera_configs:
            cam_id = cam_cfg.get("id", 1)
            self.cameras[cam_id] = CameraStream(
                camera_id=cam_id,
                name=cam_cfg.get("name", f"Camera {cam_id}"),
                source=cam_cfg.get("source", 0),
                resolution=cam_cfg.get("resolution", [640, 480]),
                fps=cam_cfg.get("fps", 25)
            )

    def get_camera(self, camera_id=1):
        return self.cameras.get(camera_id) or list(self.cameras.values())[0] if self.cameras else None

    def release_all(self):
        for cam in self.cameras.values():
            cam.release()
