import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from .session import Base


def generate_uuid():
    return str(uuid.uuid4())


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=generate_uuid)

    jd_text = Column(Text, nullable=False)
    company_info = Column(Text, nullable=False)
    interviewer_info = Column(Text, nullable=False)
    process_requirement = Column(Text, nullable=False)
    constraint_info = Column(Text, nullable=False)

    max_questions = Column(Integer, default=10)
    max_duration = Column(Integer, default=1800)

    interviewer_url = Column(String, nullable=False)
    candidate_url = Column(String, nullable=False)

    status = Column(String, default="pending")
    ai_managed = Column(Boolean, default=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    report_status = Column(String, default="pending")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship(
        "ChatMessage", back_populates="interview", cascade="all, delete-orphan"
    )
    report = relationship(
        "InterviewReport",
        back_populates="interview",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    sequence = Column(Integer, nullable=False)

    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    source = Column(String, nullable=False)
    input_type = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    audio_duration = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="messages")


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    interview_id = Column(
        String, ForeignKey("interviews.id"), nullable=False, unique=True
    )

    chat_summary = Column(Text, nullable=True)
    ability_evaluation = Column(Text, nullable=True)
    match_analysis = Column(Text, nullable=True)
    pros_cons = Column(Text, nullable=True)
    hiring_recommendation = Column(Text, nullable=True)
    followup_questions = Column(Text, nullable=True)

    final_decision = Column(String, nullable=True)
    overall_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="report")
