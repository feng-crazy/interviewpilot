from pathlib import Path
from sqlalchemy.orm import Session
import uuid

from ..database import Interview, ChatMessage, InterviewReport
from .llm_service import LLMService
from .prompt_service import PromptService

llm_service = LLMService()
prompt_service = PromptService()


class ReportService:
    def __init__(self):
        self.report_prompts_dir = (
            Path(__file__).parent.parent / "config" / "prompts" / "report"
        )

    async def generate_report(self, interview_id: str, db: Session) -> InterviewReport:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise ValueError("Interview not found")

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.interview_id == interview_id)
            .order_by(ChatMessage.sequence)
            .all()
        )

        chat_messages = prompt_service.format_chat_history(messages)

        job_position = interview.job_position
        jd_text = job_position.jd_text
        company_info = job_position.company_info
        interviewer_info = job_position.interviewer_info
        interview_scheme = job_position.interview_scheme

        chat_summary = await self._run_template(
            "chat_summary",
            {
                "chat_messages": chat_messages,
            },
        )

        ability_evaluation = await self._run_template(
            "ability_eval",
            {
                "jd_text": jd_text,
                "company_info": company_info,
                "interviewer_info": interviewer_info,
                "chat_summary": chat_summary,
            },
        )

        match_analysis = await self._run_template(
            "match_analysis",
            {
                "jd_text": jd_text,
                "company_info": company_info,
                "interviewer_info": interviewer_info,
                "interview_scheme": interview_scheme,
                "ability_evaluation": ability_evaluation,
            },
        )

        pros_cons = await self._run_template(
            "pros_cons",
            {
                "interviewer_info": interviewer_info,
                "chat_summary": chat_summary,
                "ability_evaluation": ability_evaluation,
            },
        )

        hiring_recommendation = await self._run_template(
            "hiring",
            {
                "company_info": company_info,
                "interviewer_info": interviewer_info,
                "interview_scheme": interview_scheme,
                "match_analysis": match_analysis,
                "pros_cons": pros_cons,
            },
        )

        followup_questions = await self._run_template(
            "followup",
            {
                "jd_text": jd_text,
                "interviewer_info": interviewer_info,
                "interview_scheme": interview_scheme,
                "hiring_recommendation": hiring_recommendation,
            },
        )

        final_decision = self._parse_decision(hiring_recommendation)

        report = InterviewReport(
            id=str(uuid.uuid4()),
            interview_id=interview_id,
            chat_summary=chat_summary,
            ability_evaluation=ability_evaluation,
            match_analysis=match_analysis,
            pros_cons=pros_cons,
            hiring_recommendation=hiring_recommendation,
            followup_questions=followup_questions,
            final_decision=final_decision,
        )

        db.add(report)
        interview.report_status = "completed"
        db.commit()
        db.refresh(report)

        return report

    async def _run_template(self, template_name: str, variables: dict) -> str:
        template_path = self.report_prompts_dir / f"{template_name}.md"
        template = template_path.read_text(encoding="utf-8")

        for key, value in variables.items():
            template = template.replace(f"{{{key}}}", str(value) if value else "")

        return await llm_service.generate(template)

    def _parse_decision(self, hiring_text: str) -> str:
        if "强烈推荐" in hiring_text:
            return "强烈推荐"
        elif "推荐" in hiring_text:
            return "推荐"
        elif "不推荐" in hiring_text:
            return "不推荐"
        else:
            return "待定"


report_service = ReportService()
