"""
WebSocket Server Module.
Runs an async WebSocket server on Port 8765.
Streams processed video frames (JPEG base64) and detection payloads to the Node.js backend.
Listens for incoming configuration updates and control signals.
"""
import asyncio
import json
import logging
import websockets

logger = logging.getLogger("SurveillanceEngine.WebSocketServer")

class EngineWebSocketServer:
    def __init__(self, host="0.0.0.0", port=8765, config_callback=None):
        self.host = host
        self.port = port
        self.clients = set()
        self.server = None
        self.config_callback = config_callback

    async def register(self, websocket):
        self.clients.add(websocket)
        logger.info(f"🟢 Node.js Client Connected to CV Engine: {websocket.remote_address}")

    async def unregister(self, websocket):
        if websocket in self.clients:
            self.clients.remove(websocket)
            logger.info(f"🔴 Node.js Client Disconnected from CV Engine: {websocket.remote_address}")

    async def handler(self, websocket, *args):
        await self.register(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    if data.get("type") == "UPDATE_CONFIG":
                        logger.info("⚙️ Received Live Configuration Update from Node Backend!")
                        if self.config_callback:
                            self.config_callback(data.get("config", {}))
                except Exception as e:
                    logger.error(f"Error handling WebSocket message: {e}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

    async def broadcast_frame(self, frame_base64, payload):
        """Broadcasts frame and detection metadata payload to all connected Node.js clients."""
        if not self.clients:
            return

        message_data = json.dumps({
            "type": "FRAME_DATA",
            "frame": frame_base64,
            "payload": payload
        })

        disconnected_clients = set()
        for client in list(self.clients):
            try:
                await client.send(message_data)
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
            except Exception as e:
                logger.error(f"Error broadcasting frame to client: {e}")
                disconnected_clients.add(client)

        for client in disconnected_clients:
            await self.unregister(client)

    async def start(self):
        self.server = await websockets.serve(self.handler, self.host, self.port)
        logger.info(f"🚀 Python CV Engine WebSocket Server running on ws://{self.host}:{self.port}")
