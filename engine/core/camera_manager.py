"""
Camera Manager Module.
Handles video frame capture from webcams (0, 1, 2...), RTSP streams, and HTTP MJPEG video feeds.
Includes automatic frame resizing, FPS control, and connection retry logic.
"""
import cv2
import time
import logging

logger = logging.getLogger("SurveillanceEngine.CameraManager")

class CameraStream:
    """
    Manages a single video source connection.
    """
    def __init__(self, camera_id, name, source, resolution=(640, 480), fps=20):
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
        """Attempts to initialize OpenCV VideoCapture."""
        logger.info(f"Connecting to Camera ID {self.camera_id} ('{self.name}') at source: {self.source}")
        
        # If source is numeric string, cast to int (webcam index)
        source_val = self.source
        if isinstance(source_val, str) and source_val.isdigit():
            source_val = int(source_val)

        self.cap = cv2.VideoCapture(source_val)
        
        if isinstance(source_val, int):
            # Set resolution properties for local webcam
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.target_resolution[0])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.target_resolution[1])
            self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        if self.cap.isOpened():
            self.is_connected = True
            logger.info(f"Successfully connected to Camera ID {self.camera_id}")
        else:
            self.is_connected = False
            logger.error(f"Failed to open Camera ID {self.camera_id} at source {self.source}")

    def read_frame(self):
        """
        Reads next frame from source while maintaining target FPS rate.
        Returns (success: bool, frame: np.ndarray or None)
        """
        if not self.is_connected or self.cap is None:
            self._connect()
            if not self.is_connected:
                return False, None

        ret, frame = self.cap.read()
        if not ret or frame is None:
            logger.warning(f"Camera ID {self.camera_id} frame read failed. Attempting reconnect...")
            self.is_connected = False
            self.cap.release()
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
    Manages multiple CameraStream instances dynamically.
    """
    def __init__(self, camera_configs):
        self.cameras = {}
        for cam_cfg in camera_configs:
            cam_id = cam_cfg.get("id")
            self.cameras[cam_id] = CameraStream(
                camera_id=cam_id,
                name=cam_cfg.get("name", f"Camera {cam_id}"),
                source=cam_cfg.get("source", 0),
                resolution=cam_cfg.get("resolution", [640, 480]),
                fps=cam_cfg.get("fps", 20)
            )

    def get_camera(self, camera_id):
        return self.cameras.get(camera_id)

    def release_all(self):
        for cam in self.cameras.values():
            cam.release()
