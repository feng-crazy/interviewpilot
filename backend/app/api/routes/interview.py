from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import json

from ...database import get_db, init_db, Interview, ChatMessage, InterviewReport
from ...models.interview import (
    InterviewCreateRequest,
    InterviewResponse,
    InterviewConfig,
    InterviewDetail,
    InterviewListResponse,
    InterviewListItem,
    ChatMessageDTO,
    ReportDTO,
)

router = APIRouter()


def generate_interview_urls(interview_id: str) -> tuple:
    base_url = f"/interview/{interview_id}"
    return f"{base_url}/interviewer", f"{base_url}/candidate"


@router.post("/create", response_model=InterviewResponse)
async def create_interview(
    request: InterviewCreateRequest, db: Session = Depends(get_db)
):
    interview_id = str(uuid.uuid4())
    interviewer_url, candidate_url = generate_interview_urls(interview_id)

    interview = Interview(
        id=interview_id,
        jd_text=request.jd_text,
        company_info=request.company_info,
        interviewer_info=request.interviewer_info,
        process_requirement=request.process_requirement,
        constraint_info=request.constraint_info,
        max_questions=request.get_max_questions(),
        max_duration=request.get_max_duration(),
        interviewer_url=interviewer_url,
        candidate_url=candidate_url,
        status="pending",
        ai_managed=True,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return InterviewResponse(
        interview_id=interview.id,
        interviewer_url=interview.interviewer_url,
        candidate_url=interview.candidate_url,
    )


@router.get("/history", response_model=InterviewListResponse)
async def get_interview_history(
    db: Session = Depends(get_db), limit: int = 50, offset: int = 0
):
    interviews = (
        db.query(Interview)
        .order_by(Interview.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total = db.query(Interview).count()

    items = [
        InterviewListItem(
            id=i.id,
            jd_text=i.jd_text[:100] + "..." if len(i.jd_text) > 100 else i.jd_text,
            interviewer_info=i.interviewer_info,
            status=i.status,
            created_at=i.created_at,
            ended_at=i.ended_at,
        )
        for i in interviews
    ]

    return InterviewListResponse(items=items, total=total)


@router.get("/{interview_id}", response_model=InterviewConfig)
async def get_interview_config(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    return InterviewConfig(
        id=interview.id,
        jd_text=interview.jd_text,
        company_info=interview.company_info,
        interviewer_info=interview.interviewer_info,
        process_requirement=interview.process_requirement,
        max_questions=interview.max_questions,
        max_duration=interview.max_duration,
        status=interview.status,
        ai_managed=interview.ai_managed,
        candidate_url=interview.candidate_url,
        created_at=interview.created_at,
    )


@router.get("/{interview_id}/detail", response_model=InterviewDetail)
async def get_interview_detail(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.interview_id == interview_id)
        .order_by(ChatMessage.sequence)
        .all()
    )

    report = (
        db.query(InterviewReport)
        .filter(InterviewReport.interview_id == interview_id)
        .first()
    )

    message_dtos = [
        ChatMessageDTO(
            id=m.id,
            sequence=m.sequence,
            role=m.role,
            content=m.content,
            source=m.source,
            input_type=m.input_type,
            created_at=m.created_at,
        )
        for m in messages
    ]

    report_dto = None
    if report:
        report_dto = ReportDTO(
            id=report.id,
            chat_summary=report.chat_summary,
            ability_evaluation=report.ability_evaluation,
            match_analysis=report.match_analysis,
            pros_cons=report.pros_cons,
            hiring_recommendation=report.hiring_recommendation,
            followup_questions=report.followup_questions,
            final_decision=report.final_decision,
            overall_score=report.overall_score,
            created_at=report.created_at,
        )

    config = InterviewConfig(
        id=interview.id,
        jd_text=interview.jd_text,
        company_info=interview.company_info,
        interviewer_info=interview.interviewer_info,
        process_requirement=interview.process_requirement,
        max_questions=interview.max_questions,
        max_duration=interview.max_duration,
        status=interview.status,
        ai_managed=interview.ai_managed,
        candidate_url=interview.candidate_url,
        created_at=interview.created_at,
    )

    return InterviewDetail(
        config=config,
        messages=message_dtos,
        report=report_dto,
    )
