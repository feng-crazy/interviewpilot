from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...database import get_db, Interview, InterviewReport
from ...services.report_service import report_service
from ...models.report import ReportResponse

router = APIRouter()


@router.post("/api/report/generate/{interview_id}", response_model=ReportResponse)
async def generate_report(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status != "ended":
        raise HTTPException(status_code=400, detail="Interview must be ended first")

    existing = (
        db.query(InterviewReport)
        .filter(InterviewReport.interview_id == interview_id)
        .first()
    )

    if existing:
        return ReportResponse(
            report_id=existing.id,
            interview_id=interview_id,
            status="completed",
            final_decision=existing.final_decision,
            overall_score=existing.overall_score,
        )

    interview.report_status = "generating"
    db.commit()

    try:
        report = await report_service.generate_report(interview_id, db)
        return ReportResponse(
            report_id=report.id,
            interview_id=interview_id,
            status="completed",
            final_decision=report.final_decision,
            overall_score=report.overall_score,
        )
    except Exception as e:
        interview.report_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/report/{interview_id}")
async def get_report(interview_id: str, db: Session = Depends(get_db)):
    report = (
        db.query(InterviewReport)
        .filter(InterviewReport.interview_id == interview_id)
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": report.id,
        "interview_id": report.interview_id,
        "chat_summary": report.chat_summary,
        "ability_evaluation": report.ability_evaluation,
        "match_analysis": report.match_analysis,
        "pros_cons": report.pros_cons,
        "hiring_recommendation": report.hiring_recommendation,
        "followup_questions": report.followup_questions,
        "final_decision": report.final_decision,
        "overall_score": report.overall_score,
        "created_at": report.created_at.isoformat(),
    }
