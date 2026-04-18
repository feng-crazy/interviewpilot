from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from ...database import get_db, Interview

router = APIRouter()


class ToggleRequest(BaseModel):
    ai_managed: bool


class StartResponse(BaseModel):
    status: str
    started_at: datetime


class EndResponse(BaseModel):
    status: str
    ended_at: datetime


@router.post("/api/control/start/{interview_id}", response_model=StartResponse)
async def start_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "ongoing"
    interview.started_at = datetime.utcnow()
    db.commit()

    return StartResponse(status=interview.status, started_at=interview.started_at)


@router.post("/api/control/toggle/{interview_id}")
async def toggle_ai_managed(
    interview_id: str, request: ToggleRequest, db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.ai_managed = request.ai_managed
    db.commit()

    return {"ai_managed": interview.ai_managed}


@router.post("/api/control/end/{interview_id}", response_model=EndResponse)
async def end_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "ended"
    interview.ended_at = datetime.utcnow()
    db.commit()

    return EndResponse(status=interview.status, ended_at=interview.ended_at)
