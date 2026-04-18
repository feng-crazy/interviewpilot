from fastapi import WebSocket
from typing import Dict, Set
import asyncio
import json


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, interview_id: str, websocket: WebSocket):
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = set()
        self.active_connections[interview_id].add(websocket)

    def disconnect(self, interview_id: str, websocket: WebSocket):
        if interview_id in self.active_connections:
            self.active_connections[interview_id].discard(websocket)
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]

    async def broadcast(self, interview_id: str, message: dict):
        if interview_id in self.active_connections:
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

    async def send_to_one(self, interview_id: str, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except:
            pass


ws_manager = WebSocketManager()
