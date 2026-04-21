"""Speech recognition service using DashScope SDK Recognition class."""

import asyncio
import threading
from queue import Queue

import dashscope
from dashscope.audio.asr import Recognition, RecognitionCallback, RecognitionResult

from ..config import get_settings
from ..config.logging import get_logger

settings = get_settings()


class SpeechRecognitionCallback(RecognitionCallback):
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
        self.result_queue.put(None)  # Signal completion

    def on_complete(self) -> None:
        self.logger.info("speech_recognition_completed")
        self._completed = True
        self.result_queue.put(None)  # Signal completion

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

        # Configure DashScope
        dashscope.api_key = self.api_key
        dashscope.base_websocket_api_url = self.ws_url

    async def transcribe_websocket(self, websocket):
        """Handle WebSocket connection for real-time speech recognition.

        Args:
            websocket: FastAPI WebSocket connection
        """
        await websocket.accept()
        self.logger.info("speech_websocket_accepted")

        # Create queue for results from callback
        result_queue = Queue()

        # Create callback
        callback = SpeechRecognitionCallback(result_queue, self.logger)

        # Create Recognition instance
        recognition = Recognition(
            model=self.model, format="pcm", sample_rate=16000, callback=callback
        )

        # Thread for sending audio to recognition
        audio_queue = Queue()
        stop_event = threading.Event()

        def audio_sender():
            """Thread that sends audio chunks to Recognition."""
            try:
                while not stop_event.is_set():
                    try:
                        chunk = audio_queue.get(timeout=0.1)
                        if chunk is None:  # Stop signal
                            break
                        recognition.send_audio_frame(chunk)
                    except Exception:
                        continue
            except Exception as e:
                self.logger.error("audio_sender_error", error=str(e))

        # Start recognition
        try:
            recognition.start()
            self.logger.info("speech_recognition_started")

            # Start audio sender thread
            sender_thread = threading.Thread(target=audio_sender, daemon=True)
            sender_thread.start()

            # Main loop: receive audio from frontend, forward to recognition,
            # and send results back to frontend
            async def receive_audio():
                """Receive audio chunks from frontend WebSocket."""
                try:
                    while True:
                        data = await websocket.receive_bytes()
                        audio_queue.put(data)
                except Exception:
                    audio_queue.put(None)  # Signal stop

            async def send_results():
                """Send transcription results to frontend WebSocket."""
                while not callback.is_completed():
                    try:
                        # Check queue with timeout to allow checking completion
                        result = await asyncio.get_event_loop().run_in_executor(
                            None, lambda: result_queue.get(timeout=0.1)
                        )
                        if result is None:  # Completion signal
                            break
                        if "error" in result:
                            await websocket.send_json(result)
                            break
                        await websocket.send_json(result)
                    except Exception:
                        continue

            # Run both tasks concurrently
            receive_task = asyncio.create_task(receive_audio())
            send_task = asyncio.create_task(send_results())

            # Wait for send_task to complete (transcription done)
            await send_task

            # Cancel receive task if still running
            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass

            # Stop recognition
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


speech_service = SpeechService()
