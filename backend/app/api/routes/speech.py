"""WebSocket endpoint for real-time speech recognition."""

from fastapi import APIRouter, WebSocket

from ...services.speech_service import DASHSCOPE_AVAILABLE, speech_service

router = APIRouter()


@router.websocket("/ws/speech")
async def speech_websocket(websocket: WebSocket):
    """Proxy audio stream to Paraformer API for real-time transcription.

    Client sends binary audio chunks (PCM 16kHz 16bit mono).
    Server sends JSON transcription results: {"text": "...", "is_final": bool}
    """
    if not DASHSCOPE_AVAILABLE:
        await websocket.accept()
        await websocket.send_json(
            {
                "error": "Speech recognition unavailable: dashscope package not installed. "
                "Install with: pip install dashscope"
            }
        )
        await websocket.close()
        return

    await speech_service.transcribe_websocket(websocket)
