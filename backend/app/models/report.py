from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReportResponse(BaseModel):
    report_id: str
    interview_id: str
    status: str
    final_decision: Optional[str] = None
    overall_score: Optional[float] = None


class InterviewReport(BaseModel):
    id: str
    interview_id: str
    chat_summary: Optional[str] = None
    ability_evaluation: Optional[str] = None
    match_analysis: Optional[str] = None
    pros_cons: Optional[str] = None
    hiring_recommendation: Optional[str] = None
    followup_questions: Optional[str] = None
    final_decision: Optional[str] = None
    overall_score: Optional[float] = None
    created_at: datetime
