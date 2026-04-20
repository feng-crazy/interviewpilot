from fastapi import WebSocket
from typing import Dict, Set
import asyncio
import json

from ..config.logging import get_logger
import structlog.contextvars as contextvars


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.logger = get_logger("websocket_manager")

    async def connect(self, interview_id: str, websocket: WebSocket):
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = set()
        self.active_connections[interview_id].add(websocket)

        # 绑定 interview_id 到日志上下文
        contextvars.bind_contextvars(interview_id=interview_id)

        active_count = len(self.active_connections[interview_id])
        self.logger.info(
            "websocket_connected",
            interview_id=interview_id,
            active_connections=active_count,
        )

    def disconnect(self, interview_id: str, websocket: WebSocket):
        was_connected = (
            interview_id in self.active_connections
            and websocket in self.active_connections[interview_id]
        )

        if interview_id in self.active_connections:
            self.active_connections[interview_id].discard(websocket)
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]

        # 清理上下文（只在最后一个连接断开时）
        remaining_count = len(self.active_connections.get(interview_id, set()))
        self.logger.info(
            "websocket_disconnected",
            interview_id=interview_id,
            remaining_connections=remaining_count,
        )

        if remaining_count == 0:
            contextvars.unbind_contextvars("interview_id")

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
