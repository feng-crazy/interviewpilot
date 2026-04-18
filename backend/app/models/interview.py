import json
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class InterviewCreateRequest(BaseModel):
    jd_text: str = Field(..., description="岗位JD")
    company_info: str = Field(..., description="公司信息")
    interviewer_info: str = Field(..., description="面试官信息")
    process_requirement: str = Field(..., description="流程要求")
    constraint_info: str = Field(..., description="约束信息JSON")

    def get_max_questions(self) -> int:
        try:
            data = json.loads(self.constraint_info)
            return data.get("max_questions", 10)
        except:
            return 10

    def get_max_duration(self) -> int:
        try:
            data = json.loads(self.constraint_info)
            return data.get("max_duration", 1800)
        except:
            return 1800


class InterviewResponse(BaseModel):
    interview_id: str
    interviewer_url: str
    candidate_url: str


class InterviewConfig(BaseModel):
    id: str
    jd_text: str
    company_info: str
    interviewer_info: str
    process_requirement: str
    max_questions: int
    max_duration: int
    status: str
    ai_managed: bool
    candidate_url: str
    created_at: datetime


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
