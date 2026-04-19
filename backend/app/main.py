from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db
from .api.routes.interview import router as interview_router
from .api.routes.chat import router as chat_router
from .api.routes.control import router as control_router
from .api.routes.websocket import router as websocket_router
from .api.routes.report import router as report_router
from .api.routes.speech import router as speech_router
from .api.routes.optimize import router as optimize_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router, prefix="/api/interview", tags=["interview"])
app.include_router(chat_router, tags=["chat"])
app.include_router(control_router, tags=["control"])
app.include_router(websocket_router, tags=["websocket"])
app.include_router(report_router, tags=["report"])
app.include_router(speech_router, tags=["speech"])
app.include_router(optimize_router, tags=["optimize"])


@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
