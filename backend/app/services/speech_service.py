"""Speech recognition service using DashScope SDK Recognition class."""

from __future__ import annotations

import asyncio
import threading
from queue import Queue

try:
    import dashscope
    from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult

    DASHSCOPE_AVAILABLE = True
except ImportError:
    DASHSCOPE_AVAILABLE = False

from ..config import get_settings
from ..config.logging import get_logger

settings = get_settings()
logger = get_logger("speech_service")

if not DASHSCOPE_AVAILABLE:
    logger.warning(
        "dashscope_sdk_not_installed",
        msg="dashscope package not installed. Speech recognition features will be unavailable. "
        "Install with: pip install dashscope",
    )


class SpeechRecognitionCallback(RecognitionCallback if DASHSCOPE_AVAILABLE else object):
    """Callback for DashScope Recognition that pushes results to a queue."""

    def __init__(self, result_queue: Queue, logger):
        self.result_queue = result_queue
        self.logger = logger
        self._completed = False

    def on_open(self) -> None:
        self.logger.info("speech_ws_connected")

    def on_close(self) -> None:
        self.logger.info("speech_ws_closed")
        self._completed = True
        self.result_queue.put(None)

    def on_complete(self) -> None:
        self.logger.info("speech_recognition_completed")
        self._completed = True
        self.result_queue.put(None)

    def on_error(self, result: RecognitionResult) -> None:
        self.logger.error(
            "speech_recognition_error",
            request_id=result.request_id
            if hasattr(result, "request_id")
            else "unknown",
            message=result.message if hasattr(result, "message") else str(result),
        )
        self.result_queue.put(
            {"error": result.message if hasattr(result, "message") else str(result)}
        )
        self._completed = True

    def on_event(self, result: RecognitionResult) -> None:
        sentence = result.get_sentence()
        if "text" in sentence:
            text = sentence["text"]
            is_final = RecognitionResult.is_sentence_end(sentence)
            self.logger.debug("speech_transcript_result", text=text, is_final=is_final)
            self.result_queue.put(
                {
                    "text": text,
                    "is_final": is_final,
                    "sentence_id": sentence.get("sentence_id", 0),
                }
            )

    def is_completed(self) -> bool:
        return self._completed


class SpeechService:
    """Real-time speech recognition using DashScope SDK.

    Proxies audio stream from frontend WebSocket to DashScope Paraformer API.
    """

    def __init__(self):
        self.model = settings.PARAFORMER_MODEL
        self.api_key = settings.DASHSCOPE_API_KEY
        self.ws_url = settings.PARAFORMER_WS_URL
        self.logger = get_logger("speech_service")

        if DASHSCOPE_AVAILABLE:
            dashscope.api_key = self.api_key
            dashscope.base_websocket_api_url = self.ws_url

    async def transcribe_websocket(self, websocket):
        """Handle WebSocket connection for real-time speech recognition.

        Args:
            websocket: FastAPI WebSocket connection
        """
        await websocket.accept()
        self.logger.info("speech_websocket_accepted")

        result_queue = Queue()
        callback = SpeechRecognitionCallback(result_queue, self.logger)

        recognition = Recognition(
            model=self.model, format="pcm", sample_rate=16000, callback=callback
        )

        audio_queue = Queue()
        stop_event = threading.Event()

        def audio_sender():
            try:
                while not stop_event.is_set():
                    try:
                        chunk = audio_queue.get(timeout=0.1)
                        if chunk is None:
                            break
                        recognition.send_audio_frame(chunk)
                    except Exception:
                        continue
            except Exception as e:
                self.logger.error("audio_sender_error", error=str(e))

        try:
            recognition.start()
            self.logger.info("speech_recognition_started")

            sender_thread = threading.Thread(target=audio_sender, daemon=True)
            sender_thread.start()

            async def receive_audio():
                try:
                    while True:
                        data = await websocket.receive_bytes()
                        audio_queue.put(data)
                except Exception:
                    audio_queue.put(None)

            async def send_results():
                while not callback.is_completed():
                    try:
                        result = await asyncio.get_event_loop().run_in_executor(
                            None, lambda: result_queue.get(timeout=0.1)
                        )
                        if result is None:
                            break
                        if "error" in result:
                            await websocket.send_json(result)
                            break
                        await websocket.send_json(result)
                    except Exception:
                        continue

            receive_task = asyncio.create_task(receive_audio())
            send_task = asyncio.create_task(send_results())

            await send_task

            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass

            stop_event.set()
            recognition.stop()
            sender_thread.join(timeout=2)

            self.logger.info(
                "speech_recognition_metrics",
                request_id=recognition.get_last_request_id(),
                first_package_delay=recognition.get_first_package_delay(),
                last_package_delay=recognition.get_last_package_delay(),
            )

        except Exception as e:
            self.logger.error("speech_websocket_error", error=str(e))
            await websocket.send_json({"error": str(e)})
        finally:
            stop_event.set()
            audio_queue.put(None)
            try:
                recognition.stop()
            except Exception:
                pass
            await websocket.close()


speech_service = SpeechService() if DASHSCOPE_AVAILABLE else None
