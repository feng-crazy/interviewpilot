from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class JobPositionCreateRequest(BaseModel):
    name: str = Field(..., description="Position name")
    jd_text: str = Field(..., description="Job description text")
    company_info: str = Field(..., description="Company information")
    interviewer_info: str = Field(..., description="Interviewer information")
    process_requirement: str = Field(..., description="Process requirements")
    default_max_questions: Optional[int] = Field(
        default=10, description="Default max questions"
    )
    default_max_duration: Optional[int] = Field(
        default=1800, description="Default max duration in seconds"
    )


class JobPositionResponse(BaseModel):
    id: str
    name: str
    jd_text: str
    company_info: str
    interviewer_info: str
    process_requirement: str
    default_max_questions: int
    default_max_duration: int
    created_at: datetime
    updated_at: datetime


class JobPositionUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, description="Position name")
    jd_text: Optional[str] = Field(default=None, description="Job description text")
    company_info: Optional[str] = Field(default=None, description="Company information")
    interviewer_info: Optional[str] = Field(
        default=None, description="Interviewer information"
    )
    process_requirement: Optional[str] = Field(
        default=None, description="Process requirements"
    )
    default_max_questions: Optional[int] = Field(
        default=None, description="Default max questions"
    )
    default_max_duration: Optional[int] = Field(
        default=None, description="Default max duration in seconds"
    )


class JobPositionDetail(BaseModel):
    id: str
    name: str
    jd_text: str
    company_info: str
    interviewer_info: str
    process_requirement: str
    default_max_questions: int
    default_max_duration: int
    created_at: datetime
    updated_at: datetime


class JobPositionListItem(BaseModel):
    id: str
    name: str
    jd_text: str
    created_at: datetime


class JobPositionListResponse(BaseModel):
    items: List[JobPositionListItem]
    total: int
