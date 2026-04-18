from fastapi import APIRouter
from .interview import router as interview_router

router = APIRouter()
router.include_router(interview_router, prefix="/interview", tags=["interview"])
