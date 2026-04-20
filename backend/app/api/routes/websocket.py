from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ...database import get_db, Interview, ChatMessage
from ...services.websocket_manager import ws_manager
from ...config.logging import get_logger

router = APIRouter()
logger = get_logger("websocket_route")


@router.websocket("/ws/interview/{interview_id}")
async def interview_websocket(
    websocket: WebSocket, interview_id: str, db: Session = Depends(get_db)
):
    await ws_manager.connect(interview_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type", "unknown")
            message_size = len(str(data))

            logger.info(
                "websocket_message_received",
                message_type=message_type,
                message_size_bytes=message_size,
            )

            if data.get("type") == "chat_message":
                interview = (
                    db.query(Interview).filter(Interview.id == interview_id).first()
                )

                if not interview:
                    await websocket.send_json(
                        {"type": "error", "message": "Interview not found"}
                    )
                    continue

                last_message = (
                    db.query(ChatMessage)
                    .filter(ChatMessage.interview_id == interview_id)
                    .order_by(ChatMessage.sequence.desc())
                    .first()
                )
                sequence = (last_message.sequence + 1) if last_message else 1

                source = (
                    "manual" if data.get("role") == "interviewer" else "candidate_input"
                )

                message = ChatMessage(
                    id=str(uuid.uuid4()),
                    interview_id=interview_id,
                    sequence=sequence,
                    role=data.get("role", "candidate"),
                    content=data.get("content", ""),
                    source=source,
                    input_type=data.get("input_type", "text"),
                )

                db.add(message)
                db.commit()
                db.refresh(message)

                logger.info(
                    "chat_message_saved",
                    message_id=message.id,
                    sequence=message.sequence,
                    role=message.role,
                    source=source,
                )

                await ws_manager.broadcast(
                    interview_id,
                    {
                        "type": "chat_sync",
                        "message": {
                            "id": message.id,
                            "sequence": message.sequence,
                            "role": message.role,
                            "content": message.content,
                            "source": message.source,
                            "input_type": message.input_type,
                            "created_at": message.created_at.isoformat(),
                        },
                    },
                )

            elif data.get("type") == "control":
                action = data.get("action")

                logger.info("control_command_received", action=action)

                if action == "toggle_ai_managed":
                    interview = (
                        db.query(Interview).filter(Interview.id == interview_id).first()
                    )
                    if interview:
                        interview.ai_managed = data.get("ai_managed", True)
                        db.commit()

                        await ws_manager.broadcast(
                            interview_id,
                            {
                                "type": "control_update",
                                "ai_managed": interview.ai_managed,
                            },
                        )

                elif action == "end_interview":
                    interview = (
                        db.query(Interview).filter(Interview.id == interview_id).first()
                    )
                    if interview:
                        interview.status = "ended"
                        interview.ended_at = datetime.utcnow()
                        db.commit()

                        await ws_manager.broadcast(
                            interview_id,
                            {
                                "type": "interview_ended",
                            },
                        )

    except WebSocketDisconnect:
        ws_manager.disconnect(interview_id, websocket)
        logger.info("websocket_client_disconnect", interview_id=interview_id)

    except Exception as e:
        ws_manager.disconnect(interview_id, websocket)
        logger.error(
            "websocket_error",
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True,
        )
