"""
Python CV Engine Main Entry Point.
Initializes computer vision hardware, deep learning models, and WebSocket streaming loop.
"""
import asyncio
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.config import load_config
from engine.core.camera_manager import CameraManager
from engine.core.motion_detector import MotionDetector
from engine.core.object_detector import ObjectDetector
from engine.core.tracker import MultiObjectTracker
from engine.core.frame_processor import FrameProcessor
from engine.server.ws_server import EngineWebSocketServer

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

async def main_loop():
    setup_logging()
    logger = logging.getLogger("SurveillanceEngine")
    logger.info("==================================================")
    logger.info("🛡️ STARTING SURVEILLANCE COMPUTER VISION ENGINE")
    logger.info("==================================================")

    config = load_config()

    camera_configs = config.get("cameras", [])
    camera_mgr = CameraManager(camera_configs)

    motion_cfg = config.get("motion", {})
    motion_detector = MotionDetector(motion_cfg)

    detection_cfg = config.get("detection", {})
    detector = ObjectDetector(detection_cfg)

    tracking_cfg = config.get("tracking", {})
    tracker = MultiObjectTracker(tracking_cfg, detector)

    processor = FrameProcessor(config, detector, tracker, motion_detector)

    def on_live_config_update(new_config):
        logger.info("🔄 Applying Live Configuration Update...")
        if "motion" in new_config:
            motion_detector.apply_config(new_config["motion"])
        if "detection" in new_config:
            detector.apply_config(new_config["detection"])

    ws_port = config.get("server", {}).get("engine_ws_port", 8765)
    ws_server = EngineWebSocketServer(
        host="0.0.0.0", 
        port=ws_port, 
        config_callback=on_live_config_update
    )
    await ws_server.start()

    logger.info("⚡ Real-time Video Stream Capture Loop Active...")

    try:
        primary_cam = camera_mgr.get_camera(1)
        while True:
            if primary_cam:
                success, frame = primary_cam.read_frame()
                if success and frame is not None:
                    annotated_frame, frame_base64, payload = processor.process_frame(
                        camera_id=primary_cam.camera_id, 
                        frame=frame
                    )
                    await ws_server.broadcast_frame(frame_base64, payload)

            await asyncio.sleep(0.001)

    except KeyboardInterrupt:
        logger.info("Shutting down CV Engine gracefully...")
    finally:
        camera_mgr.release_all()

if __name__ == "__main__":
    asyncio.run(main_loop())
