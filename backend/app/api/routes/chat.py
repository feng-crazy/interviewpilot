from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
from datetime import datetime
import uuid
import asyncio
import json

from ...database import get_db, Interview, ChatMessage
from ...services.llm_service import LLMService
from ...services.prompt_service import prompt_service
from ...services.websocket_manager import ws_manager

router = APIRouter()
llm_service = LLMService()


@router.get("/api/chat/stream/{interview_id}")
async def chat_stream(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        return {"error": "Interview not found"}

    if interview.status == "pending":
        interview.status = "ongoing"
        interview.started_at = datetime.utcnow()
        db.commit()

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.interview_id == interview_id)
        .order_by(ChatMessage.sequence)
        .all()
    )

    chat_history = prompt_service.format_chat_history(messages)

    ai_questions = (
        db.query(ChatMessage)
        .filter(ChatMessage.interview_id == interview_id, ChatMessage.role == "ai")
        .count()
    )

    elapsed_seconds = 0
    if interview.started_at:
        elapsed_seconds = int(
            (datetime.utcnow() - interview.started_at).total_seconds()
        )

    prompt = prompt_service.render_template(
        "question_prompt",
        {
            "jd_text": interview.job_position.jd_text,
            "company_info": interview.job_position.company_info,
            "interviewer_info": interview.job_position.interviewer_info,
            "interview_scheme": interview.job_position.interview_scheme,
            "resume_text": interview.resume_text or "未提供简历信息",
            "max_questions": interview.max_questions,
            "current_question_count": ai_questions,
            "max_duration": interview.max_duration // 60,
            "elapsed_duration": elapsed_seconds // 60,
            "chat_history": chat_history,
        },
    )

    async def generate():
        full_response = ""

        try:
            async for token in llm_service.generate_stream(prompt):
                full_response += token
                yield ServerSentEvent(
                    data=json.dumps({"content": token}), event="token"
                )

            if "END:" in full_response:
                interview.status = "ended"
                interview.ended_at = datetime.utcnow()
                db.commit()

                yield ServerSentEvent(data=json.dumps({"type": "end"}), event="end")

                await ws_manager.broadcast(
                    interview_id,
                    {
                        "type": "interview_ended",
                    },
                )
            elif "QUESTION:" in full_response:
                question_content = full_response.replace("QUESTION:", "").strip()

                sequence = (
                    db.query(func.max(ChatMessage.sequence))
                    .filter(ChatMessage.interview_id == interview_id)
                    .scalar()
                    or 0
                )
                sequence += 1

                ai_message = ChatMessage(
                    id=str(uuid.uuid4()),
                    interview_id=interview_id,
                    sequence=sequence,
                    role="ai",
                    content=question_content,
                    source="ai_generated",
                )

                db.add(ai_message)
                db.commit()
                db.refresh(ai_message)

                yield ServerSentEvent(
                    data=json.dumps(
                        {
                            "message_id": ai_message.id,
                            "role": "ai",
                            "content": question_content,
                        }
                    ),
                    event="done",
                )

                await ws_manager.broadcast(
                    interview_id,
                    {
                        "type": "chat_sync",
                        "message": {
                            "id": ai_message.id,
                            "sequence": ai_message.sequence,
                            "role": "ai",
                            "content": question_content,
                            "source": "ai_generated",
                            "created_at": ai_message.created_at.isoformat(),
                        },
                    },
                )
        except Exception as e:
            yield ServerSentEvent(data=json.dumps({"error": str(e)}), event="error")

    return EventSourceResponse(generate())
