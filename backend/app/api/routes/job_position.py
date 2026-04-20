from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...database import get_db, JobPosition
from ...models.job_position import (
    JobPositionCreateRequest,
    JobPositionResponse,
    JobPositionListResponse,
    JobPositionListItem,
    JobPositionDetail,
    JobPositionUpdateRequest,
)

router = APIRouter()


@router.post("/create", response_model=JobPositionResponse)
async def create_job_position(
    request: JobPositionCreateRequest, db: Session = Depends(get_db)
):
    """Create a new job position."""
    job_position = JobPosition(
        name=request.name,
        jd_text=request.jd_text,
        company_info=request.company_info,
        interviewer_info=request.interviewer_info,
        interview_scheme=request.interview_scheme,
        default_max_questions=request.default_max_questions or 10,
        default_max_duration=request.default_max_duration or 1800,
    )

    db.add(job_position)
    db.commit()
    db.refresh(job_position)

    return JobPositionResponse(
        id=job_position.id,
        name=job_position.name,
        jd_text=job_position.jd_text,
        company_info=job_position.company_info,
        interviewer_info=job_position.interviewer_info,
        interview_scheme=job_position.interview_scheme,
        default_max_questions=job_position.default_max_questions,
        default_max_duration=job_position.default_max_duration,
        created_at=job_position.created_at,
        updated_at=job_position.updated_at,
    )


@router.get("/list", response_model=JobPositionListResponse)
async def list_job_positions(
    db: Session = Depends(get_db), limit: int = 50, offset: int = 0
):
    """List all job positions with pagination."""
    positions = (
        db.query(JobPosition)
        .order_by(JobPosition.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total = db.query(JobPosition).count()

    items = [
        JobPositionListItem(
            id=p.id,
            name=p.name,
            jd_text=p.jd_text[:100] + "..." if len(p.jd_text) > 100 else p.jd_text,
            company_info=p.company_info[:50] + "..."
            if len(p.company_info) > 50
            else p.company_info,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in positions
    ]

    return JobPositionListResponse(items=items, total=total)


@router.get("/{id}", response_model=JobPositionDetail)
async def get_job_position_detail(id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific job position."""
    job_position = db.query(JobPosition).filter(JobPosition.id == id).first()
    if not job_position:
        raise HTTPException(status_code=404, detail="Job position not found")

    return JobPositionDetail(
        id=job_position.id,
        name=job_position.name,
        jd_text=job_position.jd_text,
        company_info=job_position.company_info,
        interviewer_info=job_position.interviewer_info,
        interview_scheme=job_position.interview_scheme,
        default_max_questions=job_position.default_max_questions,
        default_max_duration=job_position.default_max_duration,
        created_at=job_position.created_at,
        updated_at=job_position.updated_at,
    )


@router.put("/{id}", response_model=JobPositionResponse)
async def update_job_position(
    id: str, request: JobPositionUpdateRequest, db: Session = Depends(get_db)
):
    """Update a job position. Only provided fields will be updated."""
    job_position = db.query(JobPosition).filter(JobPosition.id == id).first()
    if not job_position:
        raise HTTPException(status_code=404, detail="Job position not found")

    # Partial update: only update provided fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job_position, field, value)

    db.commit()
    db.refresh(job_position)

    return JobPositionResponse(
        id=job_position.id,
        name=job_position.name,
        jd_text=job_position.jd_text,
        company_info=job_position.company_info,
        interviewer_info=job_position.interviewer_info,
        interview_scheme=job_position.interview_scheme,
        default_max_questions=job_position.default_max_questions,
        default_max_duration=job_position.default_max_duration,
        created_at=job_position.created_at,
        updated_at=job_position.updated_at,
    )


@router.delete("/{id}")
async def delete_job_position(id: str, db: Session = Depends(get_db)):
    """Delete a job position."""
    job_position = db.query(JobPosition).filter(JobPosition.id == id).first()
    if not job_position:
        raise HTTPException(status_code=404, detail="Job position not found")

    db.delete(job_position)
    db.commit()

    return {"success": True}
