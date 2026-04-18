from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MessageRequest(BaseModel):
    role: str = Field(..., description="Message role: interviewer/candidate")
    content: str = Field(..., description="Message content")
    input_type: Optional[str] = Field("text", description="Input type: text/voice")


class MessageResponse(BaseModel):
    message_id: str
    sequence: int
    role: str
    content: str
    created_at: datetime


class ChatMessage(BaseModel):
    id: str
    interview_id: str
    sequence: int
    role: str
    content: str
    source: str
    input_type: Optional[str] = None
    duration_seconds: Optional[int] = None
    audio_duration: Optional[float] = None
    created_at: datetime
