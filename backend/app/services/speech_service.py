"""Speech recognition service using Alibaba Paraformer API."""

import asyncio
import json
import websockets
from typing import AsyncGenerator
from ..config import get_settings

settings = get_settings()


class SpeechService:
    """Paraformer real-time speech recognition service.

    Proxies audio stream from frontend to DashScope Paraformer WebSocket API.
    """

    def __init__(self):
        self.ws_url = settings.PARAFORMER_WS_URL
        self.api_key = settings.DASHSCOPE_API_KEY
        self.model = settings.PARAFORMER_MODEL

    async def connect_to_paraformer(self) -> websockets.WebSocketClientProtocol:
        """Connect to Paraformer WebSocket API."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"{self.ws_url}?model={self.model}"
        ws = await websockets.connect(url, extra_headers=headers)

        init_message = {
            "header": {"action": "start", "streaming_mode": "duplex"},
            "payload": {
                "model": self.model,
                "audio_format": "pcm",
                "sample_rate": 16000,
                "enable_words_result": True,
            },
        }
        await ws.send(json.dumps(init_message))
        return ws

    async def transcribe_stream(
        self,
        audio_chunks: AsyncGenerator[bytes, None],
    ) -> AsyncGenerator[dict, None]:
        """Stream audio to Paraformer, yield transcription results.

        Args:
            audio_chunks: PCM audio bytes (16kHz, 16bit)

        Yields:
            dict with text, is_final, sentence_id
        """
        ws = await self.connect_to_paraformer()

        try:

            async def receive_results():
                try:
                    while True:
                        message = await ws.recv()
                        data = json.loads(message)

                        if "payload" in data:
                            payload = data["payload"]
                            text = payload.get("text", "")
                            is_final = payload.get("is_final", False)
                            sentence_id = payload.get("sentence_id", 0)

                            if text:
                                yield {
                                    "text": text,
                                    "is_final": is_final,
                                    "sentence_id": sentence_id,
                                }

                        if data.get("header", {}).get("action") == "stop":
                            break
                except websockets.exceptions.ConnectionClosed:
                    pass

            async def send_audio():
                try:
                    for chunk in audio_chunks:
                        await ws.send(chunk)
                except Exception:
                    pass
                finally:
                    stop_message = {"header": {"action": "stop"}}
                    await ws.send(json.dumps(stop_message))

            receive_task = asyncio.create_task(receive_results())
            send_task = asyncio.create_task(send_audio())

            for result in await receive_task:
                yield result

            await send_task

        finally:
            await ws.close()


speech_service = SpeechService()
