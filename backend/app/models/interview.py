from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .job_position import JobPositionDetail


class InterviewCreateRequest(BaseModel):
    job_position_id: str = Field(..., description="岗位ID")
    resume_text: Optional[str] = Field(None, description="简历文本")
    max_questions: Optional[int] = Field(None, description="最大问题数(覆盖默认)")
    max_duration: Optional[int] = Field(None, description="最大时长(秒,覆盖默认)")


class InterviewResponse(BaseModel):
    interview_id: str
    interviewer_url: str
    candidate_url: str


class InterviewConfig(BaseModel):
    id: str
    job_position_id: str
    resume_text: Optional[str] = None
    max_questions: int
    max_duration: int
    status: str
    ai_managed: bool
    candidate_url: str
    created_at: datetime
    jd_text: str
    company_info: str
    interviewer_info: str
    interview_scheme: str


class ChatMessageDTO(BaseModel):
    id: str
    sequence: int
    role: str
    content: str
    source: str
    input_type: Optional[str] = None
    created_at: datetime


class ReportDTO(BaseModel):
    id: str
    chat_summary: Optional[str] = None
    ability_evaluation: Optional[str] = None
    match_analysis: Optional[str] = None
    pros_cons: Optional[str] = None
    hiring_recommendation: Optional[str] = None
    followup_questions: Optional[str] = None
    final_decision: Optional[str] = None
    overall_score: Optional[float] = None
    created_at: datetime


class InterviewDetail(BaseModel):
    config: InterviewConfig
    job_position: Optional[JobPositionDetail] = None
    messages: List[ChatMessageDTO]
    report: Optional[ReportDTO] = None


class InterviewListItem(BaseModel):
    id: str
    jd_text: str
    interviewer_info: str
    status: str
    created_at: datetime
    ended_at: Optional[datetime] = None


class InterviewListResponse(BaseModel):
    items: List[InterviewListItem]
    total: int
