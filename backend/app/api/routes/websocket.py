from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ...database import get_db, Interview, ChatMessage
from ...services.websocket_manager import ws_manager

router = APIRouter()


@router.websocket("/ws/interview/{interview_id}")
async def interview_websocket(
    websocket: WebSocket, interview_id: str, db: Session = Depends(get_db)
):
    await ws_manager.connect(interview_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

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
