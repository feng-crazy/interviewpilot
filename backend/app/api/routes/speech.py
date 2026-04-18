"""WebSocket endpoint for real-time speech recognition."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ...services.speech_service import speech_service

router = APIRouter()


@router.websocket("/ws/speech")
async def speech_websocket(websocket: WebSocket):
    """Proxy audio stream to Paraformer API for real-time transcription.

    Client sends binary audio chunks (PCM 16kHz 16bit mono).
    Server sends JSON transcription results: {"text": "...", "is_final": bool}
    """
    await websocket.accept()

    async def audio_generator():
        try:
            while True:
                data = await websocket.receive_bytes()
                yield data
        except WebSocketDisconnect:
            pass

    try:
        for result in speech_service.transcribe_stream(audio_generator()):
            await websocket.send_json(result)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
