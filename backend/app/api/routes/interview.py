from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from ...database import (
    get_db,
    Interview,
    ChatMessage,
    InterviewReport,
    JobPosition,
)
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
    job_position = (
        db.query(JobPosition).filter(JobPosition.id == request.job_position_id).first()
    )
    if not job_position:
        raise HTTPException(status_code=404, detail="Job position not found")

    interview_id = str(uuid.uuid4())
    interviewer_url, candidate_url = generate_interview_urls(interview_id)

    max_questions = request.max_questions or job_position.default_max_questions
    max_duration = request.max_duration or job_position.default_max_duration

    interview = Interview(
        id=interview_id,
        job_position_id=request.job_position_id,
        resume_text=request.resume_text,
        max_questions=max_questions,
        max_duration=max_duration,
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
            jd_text=i.job_position.jd_text[:100] + "..."
            if len(i.job_position.jd_text) > 100
            else i.job_position.jd_text,
            interviewer_info=i.job_position.interviewer_info,
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
        job_position_id=interview.job_position_id,
        resume_text=interview.resume_text,
        jd_text=interview.job_position.jd_text,
        company_info=interview.job_position.company_info,
        interviewer_info=interview.job_position.interviewer_info,
        interview_scheme=interview.job_position.interview_scheme,
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
        job_position_id=interview.job_position_id,
        resume_text=interview.resume_text,
        jd_text=interview.job_position.jd_text,
        company_info=interview.job_position.company_info,
        interviewer_info=interview.job_position.interviewer_info,
        interview_scheme=interview.job_position.interview_scheme,
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
