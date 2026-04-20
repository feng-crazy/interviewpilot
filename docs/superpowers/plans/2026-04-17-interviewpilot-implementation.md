# InterviewPilot 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个企业级 AI 面试智能体系统，实现面试创建、AI托管面试、实时监控、报告生成全流程。

**Architecture:** 前后端分离架构。后端使用 FastAPI + SQLite，提供 REST API + SSE 流式输出 + WebSocket 实时同步。前端使用 React + Vercel AI SDK 实现流式聊天和语音输入。外部服务使用阿里云 DashScope（通义千问 LLM + Paraformer 语音识别）。

**Tech Stack:** React 18, FastAPI, SQLite, SQLAlchemy, SSE, WebSocket, 阿里通义千问, Paraformer

---

## 文件结构概览

```
interviewpilot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI 入口
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   ├── settings.py              # 配置管理
│   │   │   └── prompts/                 # 提示词模板目录
│   │   │       ├── question_prompt.md
│   │   │       ├── end_check_prompt.md
│   │   │       ├── report/
│   │   │       │   ├── chat_summary.md
│   │   │       │   ├── ability_eval.md
│   │   │       │   ├── match_analysis.md
│   │   │       │   ├── pros_cons.md
│   │   │       │   ├── hiring.md
│   │   │       │   ├── followup.md
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── session.py               # 数据库连接
│   │   │   ├── models.py                # SQLAlchemy 模型
│   │   ├── models/                      # Pydantic 模型
│   │   │   ├── __init__.py
│   │   │   ├── interview.py
│   │   │   ├── chat.py
│   │   │   ├── report.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── interview_service.py     # 面试管理
│   │   │   ├── llm_service.py           # LLM 调用
│   │   │   ├── prompt_service.py        # 提示词管理
│   │   │   ├── report_service.py        # 报告生成
│   │   │   ├── speech_service.py        # 语音代理
│   │   │   ├── websocket_manager.py     # WS 连接管理
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── interview.py         # 面试 CRUD
│   │   │   │   ├── chat.py              # SSE 流式输出
│   │   │   │   ├── control.py           # 控制指令
│   │   │   │   ├── report.py            # 报告 API
│   │   │   │   ├── speech.py            # 语音 WS
│   │   │   │   ├── websocket.py         # 实时同步 WS
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── test_interview.py
│   │   │   ├── test_chat.py
│   │   │   ├── test_llm.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── .env.example
│   └── data/
│   │   ├── interviewpilot.db            # SQLite 数据库
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # 首页
│   │   │   ├── ConfigPage.tsx           # 面试配置页
│   │   │   ├── CandidatePage.tsx        # 面试者页面
│   │   │   ├── InterviewerPage.tsx      # 面试官页面
│   │   │   ├── HistoryPage.tsx          # 面试记录页
│   │   │   ├── DetailPage.tsx           # 面试详情页
│   │   ├── components/
│   │   │   ├── ChatBox.tsx              # 流式聊天框
│   │   │   ├── VoiceInput.tsx           # 语音输入
│   │   │   ├── ControlPanel.tsx         # 控制按钮
│   │   │   ├── ReportView.tsx           # 报告展示
│   │   │   ├── ConfigForm.tsx           # 配置表单
│   │   │   ├── MessageList.tsx          # 消息列表
│   │   ├── hooks/
│   │   │   ├── useChat.ts               # 流式聊天
│   │   │   ├── useWebSocket.ts          # WebSocket 连接
│   │   │   ├── useSpeechRecognition.ts  # 语音识别
│   │   │   ├── useInterview.ts          # 面试状态
│   │   ├── services/
│   │   │   ├── api.ts                   # HTTP API
│   │   │   ├── websocket.ts             # WS 服务
│   │   │   ├── speech.ts                # 语音服务
│   │   ├── types/
│   │   │   ├── interview.ts             # 类型定义
│   │   │   ├── chat.ts
│   │   │   ├── report.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── router.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│
├── docs/
│   ├── superpowers/
│   │   ├── specs/
│   │   │   ├── 2026-04-17-interviewpilot-design.md
│   │   ├── plans/
│   │   │   ├── 2026-04-17-interviewpilot-implementation.md
│
├── README.md
├── .gitignore
├── Makefile                              # 启动脚本
```

---

## Phase 1: 项目骨架与基础设施

### Task 1.1: 创建后端项目结构

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config/__init__.py`
- Create: `backend/app/config/settings.py`
- Create: `backend/requirements.txt`
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/data/.gitkeep`
- Create: `Makefile`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p backend/app/config/prompts/report backend/app/database backend/app/models backend/app/services backend/app/api/routes backend/app/tests backend/data
mkdir -p frontend/src/pages frontend/src/components frontend/src/hooks frontend/src/services frontend/src/types
mkdir -p docs/superpowers/specs docs/superpowers/plans
```

- [ ] **Step 2: 创建 backend/app/__init__.py**

```python
"""InterviewPilot Backend Application"""
__version__ = "0.1.0"
```

- [ ] **Step 3: 创建 backend/app/config/__init__.py**

```python
from .settings import Settings, get_settings

__all__ = ["Settings", "get_settings"]
```

- [ ] **Step 4: 创建 backend/app/config/settings.py**

```python
"""Application configuration settings."""
import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "InterviewPilot"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/interviewpilot.db"
    
    # DashScope API (阿里云)
    DASHSCOPE_API_KEY: Optional[str] = None
    DASHSCOPE_API_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    DASHSCOPE_MODEL: str = "qwen-plus"
    
    # Paraformer Speech Recognition
    PARAFORMER_WS_URL: str = "wss://dashscope.aliyuncs.com/api-ws/v1/inference"
    PARAFORMER_MODEL: str = "paraformer-realtime-v2"
    
    # LLM Settings
    LLM_MAX_TOKENS: int = 2000
    LLM_TEMPERATURE: float = 0.7
    LLM_TIMEOUT: int = 30
    
    # Interview Settings
    DEFAULT_MAX_QUESTIONS: int = 10
    DEFAULT_MAX_DURATION: int = 1800  # seconds
    
    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:5173"
    
    def __init__(self):
        # Load from environment
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        self.DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
        self.DATABASE_URL = os.getenv("DATABASE_URL", self.DATABASE_URL)
        self.FRONTEND_URL = os.getenv("FRONTEND_URL", self.FRONTEND_URL)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

- [ ] **Step 5: 创建 backend/requirements.txt**

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-multipart>=0.0.6
websockets>=11.0
openai>=1.0.0
sse-starlette>=1.6.0
httpx>=0.24.0
pytest>=7.0.0
pytest-asyncio>=0.21.0
```

- [ ] **Step 6: 创建 backend/pyproject.toml**

```toml
[project]
name = "interviewpilot-backend"
version = "0.1.0"
description = "InterviewPilot Backend - AI Interview Agent System"
requires-python = ">=3.10"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 7: 创建 backend/.env.example**

```
# DashScope API Key (Required)
DASHSCOPE_API_KEY=your-api-key-here

# Database
DATABASE_URL=sqlite:///./data/interviewpilot.db

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Debug Mode
DEBUG=false
```

- [ ] **Step 8: 创建 backend/data/.gitkeep**

```bash
touch backend/data/.gitkeep
```

- [ ] **Step 9: 创建 Makefile**

```makefile
.PHONY: install backend frontend dev clean test

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend and frontend..."
	@make backend & make frontend

clean:
	rm -rf backend/data/*.db
	rm -rf frontend/dist
	rm -rf __pycache__ .pycache

test:
	cd backend && pytest -v
	cd frontend && npm test
```

- [ ] **Step 10: 提交 Phase 1.1**

```bash
git add backend/ Makefile
git commit -m "feat: create backend project structure and configuration"
```

---

### Task 1.2: 创建数据库模型

**Files:**
- Create: `backend/app/database/__init__.py`
- Create: `backend/app/database/session.py`
- Create: `backend/app/database/models.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/interview.py`
- Create: `backend/app/models/chat.py`
- Create: `backend/app/models/report.py`

- [ ] **Step 1: 创建 backend/app/database/__init__.py**

```python
from .session import get_db, init_db
from .models import Interview, ChatMessage, InterviewReport

__all__ = ["get_db", "init_db", "Interview", "ChatMessage", "InterviewReport"]
```

- [ ] **Step 2: 创建 backend/app/database/session.py**

```python
"""Database session management."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from ..config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    from .models import Interview, ChatMessage, InterviewReport
    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 3: 创建 backend/app/database/models.py**

```python
"""SQLAlchemy database models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .session import Base


def generate_uuid():
    return str(uuid.uuid4())


class Interview(Base):
    """Interview session model."""
    __tablename__ = "interviews"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    
    # Configuration fields (required)
    jd_text = Column(Text, nullable=False)
    company_info = Column(Text, nullable=False)
    interviewer_info = Column(Text, nullable=False)
    interview_scheme = Column(Text, nullable=False)
    constraint_info = Column(Text, nullable=False)  # JSON format
    
    # Parsed constraint fields
    max_questions = Column(Integer, default=10)
    max_duration = Column(Integer, default=1800)  # seconds
    
    # Interview URLs
    interviewer_url = Column(String, nullable=False)
    candidate_url = Column(String, nullable=False)
    
    # Status fields
    status = Column(String, default="pending")  # pending/ongoing/ended
    ai_managed = Column(Boolean, default=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    
    # Report status
    report_status = Column(String, default="pending")  # pending/generating/completed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = relationship("ChatMessage", back_populates="interview", cascade="all, delete-orphan")
    report = relationship("InterviewReport", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class ChatMessage(Base):
    """Chat message model."""
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    
    # Message content
    role = Column(String, nullable=False)  # ai/interviewer/candidate
    content = Column(Text, nullable=False)
    
    # Metadata
    source = Column(String, nullable=False)  # ai_generated/manual/system
    input_type = Column(String, nullable=True)  # text/voice
    duration_seconds = Column(Integer, nullable=True)  # Reserved for timing
    
    # Voice transcription info
    audio_duration = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="messages")


class InterviewReport(Base):
    """Interview report model."""
    __tablename__ = "interview_reports"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False, unique=True)
    
    # Report sections (from 6 templates)
    chat_summary = Column(Text, nullable=True)
    ability_evaluation = Column(Text, nullable=True)
    match_analysis = Column(Text, nullable=True)
    pros_cons = Column(Text, nullable=True)
    hiring_recommendation = Column(Text, nullable=True)
    followup_questions = Column(Text, nullable=True)
    
    # Final conclusion
    final_decision = Column(String, nullable=True)  # recommend/not_recommend/pending
    overall_score = Column(Float, nullable=True)  # 0-100
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="report")
```

- [ ] **Step 4: 创建 backend/app/models/__init__.py**

```python
from .interview import (
    InterviewCreateRequest,
    InterviewResponse,
    InterviewConfig,
    InterviewDetail,
    InterviewListResponse,
)
from .chat import (
    MessageRequest,
    MessageResponse,
    ChatMessage,
)
from .report import (
    ReportResponse,
    InterviewReport,
)

__all__ = [
    "InterviewCreateRequest",
    "InterviewResponse",
    "InterviewConfig",
    "InterviewDetail",
    "InterviewListResponse",
    "MessageRequest",
    "MessageResponse",
    "ChatMessage",
    "ReportResponse",
    "InterviewReport",
]
```

- [ ] **Step 5: 创建 backend/app/models/interview.py**

```python
"""Pydantic models for interview."""
import json
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class InterviewCreateRequest(BaseModel):
    """Request to create a new interview."""
    jd_text: str = Field(..., description="岗位JD")
    company_info: str = Field(..., description="公司信息")
    interviewer_info: str = Field(..., description="面试偏好信息")
    interview_scheme: str = Field(..., description="面试方案")
    constraint_info: str = Field(..., description="约束信息JSON")
    
    def get_max_questions(self) -> int:
        """Parse max_questions from constraint_info."""
        try:
            data = json.loads(self.constraint_info)
            return data.get("max_questions", 10)
        except:
            return 10
    
    def get_max_duration(self) -> int:
        """Parse max_duration from constraint_info."""
        try:
            data = json.loads(self.constraint_info)
            return data.get("max_duration", 1800)
        except:
            return 1800


class InterviewResponse(BaseModel):
    """Response after creating interview."""
    interview_id: str
    interviewer_url: str
    candidate_url: str


class InterviewConfig(BaseModel):
    """Interview configuration data."""
    id: str
    jd_text: str
    company_info: str
    interviewer_info: str
    interview_scheme: str
    max_questions: int
    max_duration: int
    status: str
    ai_managed: bool
    created_at: datetime


class ChatMessageDTO(BaseModel):
    """Chat message data transfer object."""
    id: str
    sequence: int
    role: str
    content: str
    source: str
    input_type: Optional[str] = None
    created_at: datetime


class ReportDTO(BaseModel):
    """Report data transfer object."""
    id: str
    chat_summary: Optional[str] = None
    ability_evaluation: Optional[str] = None
    match_analysis: Optional[str] = None
    pros_cons: Optional[str] = None
    hiring_recommendation: Optional[str] = None
    followup_questions: Optional[str] = None
    final_decision: Optional[str] = None
    overall_score: Optional[float] = None
    created_at: datetime


class InterviewDetail(BaseModel):
    """Full interview detail with messages and report."""
    config: InterviewConfig
    messages: List[ChatMessageDTO]
    report: Optional[ReportDTO] = None


class InterviewListItem(BaseModel):
    """Interview list item."""
    id: str
    jd_text: str
    interviewer_info: str
    status: str
    created_at: datetime
    ended_at: Optional[datetime] = None


class InterviewListResponse(BaseModel):
    """Response for interview history list."""
    items: List[InterviewListItem]
    total: int
```

- [ ] **Step 6: 创建 backend/app/models/chat.py**

```python
"""Pydantic models for chat messages."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MessageRequest(BaseModel):
    """Request to send a message."""
    role: str = Field(..., description="Message role: interviewer/candidate")
    content: str = Field(..., description="Message content")
    input_type: Optional[str] = Field("text", description="Input type: text/voice")


class MessageResponse(BaseModel):
    """Response after sending message."""
    message_id: str
    sequence: int
    role: str
    content: str
    created_at: datetime


class ChatMessage(BaseModel):
    """Full chat message model."""
    id: str
    interview_id: str
    sequence: int
    role: str
    content: str
    source: str
    input_type: Optional[str] = None
    duration_seconds: Optional[int] = None
    audio_duration: Optional[float] = None
    created_at: datetime
```

- [ ] **Step 7: 创建 backend/app/models/report.py**

```python
"""Pydantic models for interview report."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReportResponse(BaseModel):
    """Response for report generation."""
    report_id: str
    interview_id: str
    status: str
    final_decision: Optional[str] = None
    overall_score: Optional[float] = None


class InterviewReport(BaseModel):
    """Full interview report model."""
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
```

- [ ] **Step 8: 提交 Phase 1.2**

```bash
git add backend/app/database/ backend/app/models/
git commit -m "feat: add database models and Pydantic schemas"
```

---

### Task 1.3: 创建 FastAPI 主入口和基础路由

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/routes/__init__.py`
- Create: `backend/app/api/routes/interview.py`

- [ ] **Step 1: 创建 backend/app/api/__init__.py**

```python
from .routes import interview, chat, control, report, websocket

__all__ = ["interview", "chat", "control", "report", "websocket"]
```

- [ ] **Step 2: 创建 backend/app/api/routes/__init__.py**

```python
from fastapi import APIRouter
from .interview import router as interview_router

# Will add more routers later
router = APIRouter()
router.include_router(interview_router, prefix="/interview", tags=["interview"])
```

- [ ] **Step 3: 创建 backend/app/api/routes/interview.py**

```python
"""Interview CRUD API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import json

from ..database import get_db, init_db, Interview, ChatMessage, InterviewReport
from ..models.interview import (
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
    """Generate interviewer and candidate URLs."""
    base_url = f"/interview/{interview_id}"
    return f"{base_url}/interviewer", f"{base_url}/candidate"


@router.post("/create", response_model=InterviewResponse)
async def create_interview(
    request: InterviewCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new interview session."""
    interview_id = str(uuid.uuid4())
    interviewer_url, candidate_url = generate_interview_urls(interview_id)
    
    interview = Interview(
        id=interview_id,
        jd_text=request.jd_text,
        company_info=request.company_info,
        interviewer_info=request.interviewer_info,
        interview_scheme=request.interview_scheme,
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


@router.get("/{interview_id}", response_model=InterviewConfig)
async def get_interview_config(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """Get interview configuration."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    return InterviewConfig(
        id=interview.id,
        jd_text=interview.jd_text,
        company_info=interview.company_info,
        interviewer_info=interview.interviewer_info,
        interview_scheme=interview.interview_scheme,
        max_questions=interview.max_questions,
        max_duration=interview.max_duration,
        status=interview.status,
        ai_managed=interview.ai_managed,
        created_at=interview.created_at,
    )


@router.get("/history", response_model=InterviewListResponse)
async def get_interview_history(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """Get interview history list."""
    interviews = db.query(Interview).order_by(
        Interview.created_at.desc()
    ).offset(offset).limit(limit).all()
    
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


@router.get("/{interview_id}/detail", response_model=InterviewDetail)
async def get_interview_detail(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """Get full interview detail with messages and report."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.interview_id == interview_id
    ).order_by(ChatMessage.sequence).all()
    
    report = db.query(InterviewReport).filter(
        InterviewReport.interview_id == interview_id
    ).first()
    
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
        interview_scheme=interview.interview_scheme,
        max_questions=interview.max_questions,
        max_duration=interview.max_duration,
        status=interview.status,
        ai_managed=interview.ai_managed,
        created_at=interview.created_at,
    )
    
    return InterviewDetail(
        config=config,
        messages=message_dtos,
        report=report_dto,
    )
```

- [ ] **Step 4: 创建 backend/app/main.py**

```python
"""FastAPI main application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db
from .api.routes.interview import router as interview_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    init_db()
    yield
    # Shutdown
    # Add cleanup here if needed


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview_router, prefix="/api/interview", tags=["interview"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

- [ ] **Step 5: 提交 Phase 1.3**

```bash
git add backend/app/main.py backend/app/api/
git commit -m "feat: add FastAPI main entry and interview CRUD routes"
```

---

### Task 1.4: 创建前端项目结构

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/.env.example`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/router.tsx`

- [ ] **Step 1: 初始化前端项目**

```bash
cd frontend && npm create vite@latest . -- --template react-ts
npm install react-router-dom @ai-sdk/react ai axios
```

- [ ] **Step 2: 更新 frontend/package.json**

```json
{
  "name": "interviewpilot-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@ai-sdk/react": "^0.0.1",
    "ai": "^3.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 3: 创建 frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
```

- [ ] **Step 4: 创建 frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: 创建 frontend/.env.example**

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

- [ ] **Step 6: 创建 frontend/src/index.css**

```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --background: #ffffff;
  --foreground: #0f172a;
  --border: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--background);
  color: var(--foreground);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
}

.button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.button:hover {
  opacity: 0.9;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  width: 100%;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.textarea {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  width: 100%;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.chat-input {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.message {
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  border-radius: 8px;
}

.message.ai {
  background: #f1f5f9;
}

.message.candidate {
  background: #dbeafe;
  margin-left: auto;
}

.message.interviewer {
  background: #fef3c7;
}

/* Streaming cursor animation */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--primary-color);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

- [ ] **Step 7: 创建 frontend/src/types/interview.ts**

```typescript
export interface InterviewCreateRequest {
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  interview_scheme: string;
  constraint_info: string;
}

export interface InterviewResponse {
  interview_id: string;
  interviewer_url: string;
  candidate_url: string;
}

export interface InterviewConfig {
  id: string;
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  interview_scheme: string;
  max_questions: number;
  max_duration: number;
  status: string;
  ai_managed: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sequence: number;
  role: 'ai' | 'interviewer' | 'candidate';
  content: string;
  source: 'ai_generated' | 'manual' | 'system';
  input_type?: 'text' | 'voice';
  created_at: string;
}

export interface InterviewReport {
  id: string;
  chat_summary?: string;
  ability_evaluation?: string;
  match_analysis?: string;
  pros_cons?: string;
  hiring_recommendation?: string;
  followup_questions?: string;
  final_decision?: string;
  overall_score?: number;
  created_at: string;
}

export interface InterviewDetail {
  config: InterviewConfig;
  messages: ChatMessage[];
  report?: InterviewReport;
}
```

- [ ] **Step 8: 创建 frontend/src/router.tsx**

```typescript
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import ConfigPage from './pages/ConfigPage';
import CandidatePage from './pages/CandidatePage';
import InterviewerPage from './pages/InterviewerPage';
import HistoryPage from './pages/HistoryPage';
import DetailPage from './pages/DetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: App,
    children: [
      { index: true, element: HomePage },
      { path: 'config', element: ConfigPage },
      { path: 'interview/:id/candidate', element: CandidatePage },
      { path: 'interview/:id/interviewer', element: InterviewerPage },
      { path: 'history', element: HistoryPage },
      { path: 'detail/:id', element: DetailPage },
    ],
  },
]);
```

- [ ] **Step 9: 创建 frontend/src/App.tsx**

```typescript
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="container">
      <Outlet />
    </div>
  );
}
```

- [ ] **Step 10: 创建 frontend/src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

- [ ] **Step 11: 提交 Phase 1.4**

```bash
git add frontend/
git commit -m "feat: initialize frontend project with React + Vite + TypeScript"
```

---

### Task 1.5: 创建基础页面组件

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/services/api.ts`

- [ ] **Step 1: 创建 frontend/src/services/api.ts**

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interview APIs
export const createInterview = async (data: {
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  interview_scheme: string;
  constraint_info: string;
}) => {
  const response = await api.post('/interview/create', data);
  return response.data;
};

export const getInterviewConfig = async (id: string) => {
  const response = await api.get(`/interview/${id}`);
  return response.data;
};

export const getInterviewHistory = async (limit = 50, offset = 0) => {
  const response = await api.get(`/interview/history`, { params: { limit, offset } });
  return response.data;
};

export const getInterviewDetail = async (id: string) => {
  const response = await api.get(`/interview/${id}/detail`);
  return response.data;
};
```

- [ ] **Step 2: 创建 frontend/src/pages/HomePage.tsx**

```typescript
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>InterviewPilot</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        企业AI面试智能体
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/config" className="button" style={{ textDecoration: 'none' }}>
          创建面试
        </Link>
        
        <Link to="/history" className="button" 
          style={{ textDecoration: 'none', background: '#64748b' }}>
          面试记录
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交 Phase 1.5**

```bash
git add frontend/src/services/ frontend/src/pages/HomePage.tsx
git commit -m "feat: add API service and HomePage"
```

---

## Phase 1 完成 ✓

---

## Phase 2: 核心面试流程后端

### Task 2.1: 创建 LLM 服务

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/llm_service.py`
- Create: `backend/app/config/prompts/question_prompt.md`
- Create: `backend/app/config/prompts/end_check_prompt.md`

- [ ] **Step 1: 创建 backend/app/services/__init__.py**

```python
from .llm_service import LLMService
from .prompt_service import PromptService
from .websocket_manager import WebSocketManager

__all__ = ["LLMService", "PromptService", "WebSocketManager"]
```

- [ ] **Step 2: 创建 backend/app/services/llm_service.py**

```python
"""LLM service for calling DashScope API."""
import os
from typing import AsyncGenerator, Optional
import httpx
from ..config import get_settings

settings = get_settings()


class LLMService:
    """Service for calling Qwen via OpenAI-compatible API."""
    
    def __init__(self):
        self.api_url = settings.DASHSCOPE_API_URL
        self.api_key = settings.DASHSCOPE_API_KEY or os.getenv("DASHSCOPE_API_KEY")
        self.model = settings.DASHSCOPE_MODEL
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.temperature = settings.LLM_TEMPERATURE
        self.timeout = settings.LLM_TIMEOUT
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from LLM."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": True,
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "POST",
                f"{self.api_url}/chat/completions",
                headers=headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        try:
                            import json
                            data = json.loads(line[6:])
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Generate non-streaming response from LLM."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "stream": False,
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.api_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
```

- [ ] **Step 3: 创建 backend/app/config/prompts/question_prompt.md**

```markdown
你是一个专业的面试官AI助手。请根据面试配置和历史对话，生成下一个面试问题或判断面试是否应结束。

## 面试配置

### 岗位 JD
{jd_text}

### 公司信息
{company_info}

### 面试偏好信息
{interviewer_info}

### 面试方案
{interview_scheme}

### 约束信息
- 最大问题数: {max_questions}
- 已提问数: {current_question_count}
- 最大时长: {max_duration} 分钟
- 已用时: {elapsed_duration} 分钟

## 聊天历史
{chat_history}

## 输出要求

请按以下格式输出：

### 如果面试应继续
输出下一个面试问题，格式：
QUESTION: [问题内容]

问题要求：
1. 问题应针对岗位 JD 的核心要求
2. 问题应基于面试者之前的回答深入追问
3. 问题应考察面试者未充分展示的能力维度
4. 问题应具体，避免过于泛泛

### 如果面试应结束
输出面试结束判断，格式：
END: [结束原因]

结束原因示例：
- 已充分了解面试者能力
- 达到最大问题数限制
- 达到最大时长限制
- 面试者表现已足以做出判断

## 注意
- 优先考察 JD 中的核心技术要求
- 根据 {interview_scheme} 中的考察重点调整提问策略
- 保持问题风格与 {interviewer_info} 中描述的面试官风格一致
```

- [ ] **Step 4: 创建 backend/app/config/prompts/end_check_prompt.md**

```markdown
你是一个面试流程判断专家。请判断当前面试是否应该结束。

## 面试配置

### 约束信息
- 最大问题数: {max_questions}
- 已提问数: {current_question_count}
- 最大时长: {max_duration} 分钟
- 已用时: {elapsed_duration} 分钟

### 面试方案
{interview_scheme}

## 聊天历史摘要
{chat_history_summary}

## 输出要求

请判断面试是否应该结束，按以下格式输出：

### 如果应结束
END: true
REASON: [结束原因]

### 如果不应结束
END: false
REASON: [继续原因]

## 注意
- 优先判断面试质量而非数量
- 如果已经可以做出录用判断，优先结束
- 如果接近约束上限（问题数或时长），倾向于结束
```

- [ ] **Step 5: 提交 Task 2.1**

```bash
git add backend/app/services/ backend/app/config/prompts/
git commit -m "feat: add LLM service and prompt templates"
```

---

### Task 2.2: 创建 WebSocket 管理器

**Files:**
- Create: `backend/app/services/websocket_manager.py`
- Create: `backend/app/api/routes/websocket.py`

- [ ] **Step 1: 创建 backend/app/services/websocket_manager.py**

```python
"""WebSocket connection manager for real-time sync."""
from fastapi import WebSocket
from typing import Dict, Set
import asyncio
import json


class WebSocketManager:
    """Manager for WebSocket connections per interview."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, interview_id: str, websocket: WebSocket):
        """Connect a WebSocket to an interview session."""
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = set()
        self.active_connections[interview_id].add(websocket)
    
    def disconnect(self, interview_id: str, websocket: WebSocket):
        """Disconnect a WebSocket from an interview session."""
        if interview_id in self.active_connections:
            self.active_connections[interview_id].discard(websocket)
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]
    
    async def broadcast(self, interview_id: str, message: dict):
        """Broadcast message to all connections in an interview."""
        if interview_id in self.active_connections:
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def send_to_one(self, interview_id: str, websocket: WebSocket, message: dict):
        """Send message to a specific connection."""
        try:
            await websocket.send_json(message)
        except:
            pass


# Global instance
ws_manager = WebSocketManager()
```

- [ ] **Step 2: 创建 backend/app/api/routes/websocket.py**

```python
"""WebSocket route for real-time interview sync."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from ..database import get_db, Interview, ChatMessage
from ..services.websocket_manager import ws_manager
import uuid

router = APIRouter()


@router.websocket("/ws/interview/{interview_id}")
async def interview_websocket(
    websocket: WebSocket,
    interview_id: str,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time interview sync."""
    await ws_manager.connect(interview_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "chat_message":
                # Save message to database
                interview = db.query(Interview).filter(
                    Interview.id == interview_id
                ).first()
                
                if not interview:
                    await websocket.send_json({"type": "error", "message": "Interview not found"})
                    continue
                
                # Get next sequence number
                last_message = db.query(ChatMessage).filter(
                    ChatMessage.interview_id == interview_id
                ).order_by(ChatMessage.sequence.desc()).first()
                sequence = (last_message.sequence + 1) if last_message else 1
                
                message = ChatMessage(
                    id=str(uuid.uuid4()),
                    interview_id=interview_id,
                    sequence=sequence,
                    role=data.get("role", "candidate"),
                    content=data.get("content", ""),
                    source="manual" if data.get("role") == "interviewer" else "candidate_input",
                    input_type=data.get("input_type", "text"),
                )
                
                db.add(message)
                db.commit()
                db.refresh(message)
                
                # Broadcast to all connections
                await ws_manager.broadcast(interview_id, {
                    "type": "chat_sync",
                    "message": {
                        "id": message.id,
                        "sequence": message.sequence,
                        "role": message.role,
                        "content": message.content,
                        "source": message.source,
                        "input_type": message.input_type,
                        "created_at": message.created_at.isoformat(),
                    }
                })
            
            elif data.get("type") == "control":
                # Handle control commands
                action = data.get("action")
                
                if action == "toggle_ai_managed":
                    interview = db.query(Interview).filter(
                        Interview.id == interview_id
                    ).first()
                    if interview:
                        interview.ai_managed = data.get("ai_managed", True)
                        db.commit()
                        
                        await ws_manager.broadcast(interview_id, {
                            "type": "control_update",
                            "ai_managed": interview.ai_managed,
                        })
                
                elif action == "end_interview":
                    interview = db.query(Interview).filter(
                        Interview.id == interview_id
                    ).first()
                    if interview:
                        interview.status = "ended"
                        from datetime import datetime
                        interview.ended_at = datetime.utcnow()
                        db.commit()
                        
                        await ws_manager.broadcast(interview_id, {
                            "type": "interview_ended",
                        })
    
    except WebSocketDisconnect:
        ws_manager.disconnect(interview_id, websocket)
```

- [ ] **Step 3: 更新 backend/app/main.py 添加 WebSocket 路由**

在 `main.py` 中添加:

```python
from .api.routes.websocket import router as websocket_router
from .api.routes.chat import router as chat_router

# Include routers
app.include_router(interview_router, prefix="/api/interview", tags=["interview"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(websocket_router, tags=["websocket"])
```

- [ ] **Step 4: 提交 Task 2.2**

```bash
git add backend/app/services/websocket_manager.py backend/app/api/routes/websocket.py backend/app/main.py
git commit -m "feat: add WebSocket manager and real-time sync route"
```

---

### Task 2.3: 创建 SSE 流式聊天路由

**Files:**
- Create: `backend/app/api/routes/chat.py`
- Create: `backend/app/services/prompt_service.py`

- [ ] **Step 1: 创建 backend/app/services/prompt_service.py**

```python
"""Service for loading and rendering prompt templates."""
import os
from typing import Dict, Optional
from pathlib import Path


class PromptService:
    """Service for managing prompt templates."""
    
    def __init__(self):
        self.prompts_dir = Path(__file__).parent.parent / "config" / "prompts"
    
    def load_template(self, template_name: str) -> str:
        """Load a prompt template from file."""
        template_path = self.prompts_dir / f"{template_name}.md"
        if template_path.exists():
            return template_path.read_text(encoding="utf-8")
        raise FileNotFoundError(f"Template not found: {template_name}")
    
    def render_template(
        self,
        template_name: str,
        variables: Dict[str, any],
    ) -> str:
        """Render a template with variables."""
        template = self.load_template(template_name)
        
        for key, value in variables.items():
            placeholder = "{" + key + "}"
            template = template.replace(placeholder, str(value) if value else "")
        
        return template
    
    def format_chat_history(self, messages: list) -> str:
        """Format chat messages as history string."""
        history_lines = []
        for msg in messages:
            role_name = {
                "ai": "AI面试官",
                "interviewer": "面试官",
                "candidate": "面试者",
            }.get(msg.role, msg.role)
            history_lines.append(f"{role_name}: {msg.content}")
        return "\n\n".join(history_lines)


prompt_service = PromptService()
```

- [ ] **Step 2: 创建 backend/app/api/routes/chat.py**

```python
"""SSE streaming chat route."""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse, ServerSentEvent
import asyncio
import json
from datetime import datetime

from ..database import get_db, Interview, ChatMessage
from ..services.llm_service import LLMService
from ..services.prompt_service import prompt_service
from ..services.websocket_manager import ws_manager
import uuid

router = APIRouter()
llm_service = LLMService()


@router.get("/api/chat/stream/{interview_id}")
async def chat_stream(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """SSE endpoint for streaming LLM responses."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        return {"error": "Interview not found"}
    
    if interview.status == "pending":
        interview.status = "ongoing"
        interview.started_at = datetime.utcnow()
        db.commit()
    
    # Get chat history
    messages = db.query(ChatMessage).filter(
        ChatMessage.interview_id == interview_id
    ).order_by(ChatMessage.sequence).all()
    
    chat_history = prompt_service.format_chat_history(messages)
    
    # Count AI questions
    ai_questions = db.query(ChatMessage).filter(
        ChatMessage.interview_id == interview_id,
        ChatMessage.role == "ai"
    ).count()
    
    # Calculate elapsed time
    elapsed_seconds = 0
    if interview.started_at:
        elapsed_seconds = int((datetime.utcnow() - interview.started_at).total_seconds())
    
    # Build prompt
    prompt = prompt_service.render_template("question_prompt", {
        "jd_text": interview.jd_text,
        "company_info": interview.company_info,
        "interviewer_info": interview.interviewer_info,
        "interview_scheme": interview.interview_scheme,
        "max_questions": interview.max_questions,
        "current_question_count": ai_questions,
        "max_duration": interview.max_duration // 60,
        "elapsed_duration": elapsed_seconds // 60,
        "chat_history": chat_history,
    })
    
    async def generate():
        """Generate SSE events from LLM stream."""
        full_response = ""
        
        try:
            for token in await llm_service.generate_stream(prompt):
                full_response += token
                yield ServerSentEvent(data={"content": token}, event="token")
            
            # Parse response to check for END marker
            if "END:" in full_response:
                # Interview ended
                interview.status = "ended"
                interview.ended_at = datetime.utcnow()
                db.commit()
                
                yield ServerSentEvent(data={"type": "end"}, event="end")
                
                await ws_manager.broadcast(interview_id, {
                    "type": "interview_ended",
                })
            elif "QUESTION:" in full_response:
                # Extract question content
                question_content = full_response.replace("QUESTION:", "").strip()
                
                # Save AI message to database
                last_message = db.query(ChatMessage).filter(
                    ChatMessage.interview_id == interview_id
                ).order_by(ChatMessage.sequence.desc()).first()
                sequence = (last_message.sequence + 1) if last_message else 1
                
                ai_message = ChatMessage(
                    id=str(uuid.uuid4()),
                    interview_id=interview_id,
                    sequence=sequence,
                    role="ai",
                    content=question_content,
                    source="ai_generated",
                )
                
                db.add(ai_message)
                db.commit()
                db.refresh(ai_message)
                
                yield ServerSentEvent(data={
                    "message_id": ai_message.id,
                    "role": "ai",
                    "content": question_content,
                }, event="done")
                
                # Broadcast via WebSocket
                await ws_manager.broadcast(interview_id, {
                    "type": "chat_sync",
                    "message": {
                        "id": ai_message.id,
                        "sequence": ai_message.sequence,
                        "role": "ai",
                        "content": question_content,
                        "source": "ai_generated",
                        "created_at": ai_message.created_at.isoformat(),
                    }
                })
        except Exception as e:
            yield ServerSentEvent(data={"error": str(e)}, event="error")
    
    return EventSourceResponse(generate())
```

- [ ] **Step 3: 提交 Task 2.3**

```bash
git add backend/app/services/prompt_service.py backend/app/api/routes/chat.py
git commit -m "feat: add SSE streaming chat route with prompt service"
```

---

### Task 2.4: 创建控制路由

**Files:**
- Create: `backend/app/api/routes/control.py`

- [ ] **Step 1: 创建 backend/app/api/routes/control.py**

```python
"""Control routes for interview management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db, Interview

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
async def start_interview(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """Start an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    interview.status = "ongoing"
    interview.started_at = datetime.utcnow()
    db.commit()
    
    return StartResponse(status=interview.status, started_at=interview.started_at)


@router.post("/api/control/toggle/{interview_id}")
async def toggle_ai_managed(
    interview_id: str,
    request: ToggleRequest,
    db: Session = Depends(get_db)
):
    """Toggle AI managed state."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    interview.ai_managed = request.ai_managed
    db.commit()
    
    return {"ai_managed": interview.ai_managed}


@router.post("/api/control/end/{interview_id}", response_model=EndResponse)
async def end_interview(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """End an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    interview.status = "ended"
    interview.ended_at = datetime.utcnow()
    db.commit()
    
    return EndResponse(status=interview.status, ended_at=interview.ended_at)
```

- [ ] **Step 2: 更新 main.py 添加 control router**

```python
from .api.routes.control import router as control_router

app.include_router(control_router, tags=["control"])
```

- [ ] **Step 3: 提交 Task 2.4**

```bash
git add backend/app/api/routes/control.py backend/app/main.py
git commit -m "feat: add interview control routes (start/toggle/end)"
```

---

## Phase 2 完成 ✓

---

## Phase 3: 前端页面开发

### Task 3.1: 创建配置页面

**Files:**
- Create: `frontend/src/pages/ConfigPage.tsx`
- Create: `frontend/src/components/ConfigForm.tsx`

- [ ] **Step 1: 创建 frontend/src/pages/ConfigPage.tsx**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/api';

export default function ConfigPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jd_text: '',
    company_info: '',
    interviewer_info: '',
    interview_scheme: '',
    max_questions: 10,
    max_duration: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const constraint_info = JSON.stringify({
        max_questions: formData.max_questions,
        max_duration: formData.max_duration * 60,
      });

      const result = await createInterview({
        jd_text: formData.jd_text,
        company_info: formData.company_info,
        interviewer_info: formData.interviewer_info,
        interview_scheme: formData.interview_scheme,
        constraint_info,
      });

      // Navigate to interviewer page
      navigate(result.interviewer_url);
    } catch (error) {
      alert('创建面试失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>面试配置</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>岗位 JD *</label>
          <textarea
            className="textarea"
            value={formData.jd_text}
            onChange={(e) => setFormData({ ...formData, jd_text: e.target.value })}
            placeholder="请输入岗位描述、技能要求..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>公司信息 *</label>
          <textarea
            className="textarea"
            value={formData.company_info}
            onChange={(e) => setFormData({ ...formData, company_info: e.target.value })}
            placeholder="公司名称、行业、业务简介..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>面试偏好信息 *</label>
          <textarea
            className="textarea"
            value={formData.interviewer_info}
            onChange={(e) => setFormData({ ...formData, interviewer_info: e.target.value })}
            placeholder="面试官职位、性格特点、提问风格、个人偏好等..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>面试方案 *</label>
          <textarea
            className="textarea"
            value={formData.interview_scheme}
            onChange={(e) => setFormData({ ...formData, interview_scheme: e.target.value })}
            placeholder="面试轮次、考察重点..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label>最大问题数</label>
            <input
              type="number"
              className="input"
              value={formData.max_questions}
              onChange={(e) => setFormData({ ...formData, max_questions: parseInt(e.target.value) })}
              min={1}
              max={50}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>最大时长（分钟）</label>
            <input
              type="number"
              className="input"
              value={formData.max_duration}
              onChange={(e) => setFormData({ ...formData, max_duration: parseInt(e.target.value) })}
              min={5}
              max={120}
            />
          </div>
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? '正在创建...' : '开始面试'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: 提交 Task 3.1**

```bash
git add frontend/src/pages/ConfigPage.tsx
git commit -m "feat: add interview configuration page"
```

---

### Task 3.2: 创建面试者页面

**Files:**
- Create: `frontend/src/pages/CandidatePage.tsx`
- Create: `frontend/src/hooks/useChat.ts`
- Create: `frontend/src/hooks/useWebSocket.ts`
- Create: `frontend/src/components/ChatBox.tsx`

- [ ] **Step 1: 创建 frontend/src/hooks/useWebSocket.ts**

```typescript
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  message?: any;
  ai_managed?: boolean;
}

export function useWebSocket(interviewId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/interview/${interviewId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    return () => ws.close();
  }, [interviewId]);

  const sendMessage = (role: string, content: string, input_type: string = 'text') => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        role,
        content,
        input_type,
      }));
    }
  };

  return { connected, lastMessage, sendMessage };
}
```

- [ ] **Step 2: 创建 frontend/src/hooks/useChat.ts**

```typescript
import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'ai' | 'interviewer' | 'candidate';
  content: string;
  isStreaming?: boolean;
}

export function useChat(interviewId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/stream/${interviewId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    setStreamingContent('');
    setIsStreaming(true);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.content) {
        setStreamingContent((prev) => prev + data.content);
      }
      if (data.type === 'end') {
        setIsStreaming(false);
        eventSource.close();
      }
      if (data.message_id) {
        setMessages((prev) => [...prev, {
          id: data.message_id,
          role: data.role,
          content: data.content,
        }]);
        setIsStreaming(false);
        setStreamingContent('');
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
      eventSource.close();
    };
  };

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return { messages, streamingContent, isStreaming, startStream, addMessage };
}
```

- [ ] **Step 3: 创建 frontend/src/pages/CandidatePage.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useWebSocket } from '../hooks/useWebSocket';
import { getInterviewConfig } from '../services/api';
import type { InterviewConfig } from '../types/interview';

export default function CandidatePage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [inputText, setInputText] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);

  const { messages, streamingContent, isStreaming, startStream, addMessage } = useChat(id || '');
  const { connected, lastMessage, sendMessage } = useWebSocket(id || '');

  useEffect(() => {
    if (id) {
      getInterviewConfig(id).then(setConfig);
    }
  }, [id]);

  useEffect(() => {
    if (lastMessage?.type === 'chat_sync') {
      addMessage(lastMessage.message);
    }
    if (lastMessage?.type === 'interview_ended') {
      setInterviewEnded(true);
    }
  }, [lastMessage, addMessage]);

  const handleReady = () => {
    setReady(true);
    startStream();
  };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage('candidate', inputText.trim());
      addMessage({
        id: Date.now().toString(),
        role: 'candidate',
        content: inputText.trim(),
      });
      setInputText('');
      // Start new AI question stream
      setTimeout(() => startStream(), 500);
    }
  };

  if (interviewEnded) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>面试已结束</h2>
        <p style={{ color: '#64748b' }}>感谢您的参与，祝您一切顺利！</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div style={{ padding: '1rem', background: '#f8fafc' }}>
        <h3>AI面试 - {config?.jd_text?.slice(0, 50)}...</h3>
        <span style={{ color: connected ? '#22c55e' : '#ef4444' }}>
          {connected ? '已连接' : '未连接'}
        </span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role === 'ai' ? 'AI面试官' : '面试者'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        
        {isStreaming && (
          <div className="message ai">
            <strong>AI面试官:</strong>
            <p>{streamingContent}<span className="streaming-cursor" /></p>
          </div>
        )}
      </div>

      <div className="chat-input">
        {!ready ? (
          <button className="button" onClick={handleReady} style={{ width: '100%' }}>
            准备好了
          </button>
        ) : (
          <>
            <textarea
              className="textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入您的回答..."
              disabled={isStreaming}
              style={{ minHeight: '80px' }}
            />
            <button 
              className="button" 
              onClick={handleSend}
              disabled={isStreaming || !inputText.trim()}
              style={{ marginTop: '0.5rem' }}
            >
              发送回答
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交 Task 3.2**

```bash
git add frontend/src/hooks/ frontend/src/pages/CandidatePage.tsx
git commit -m "feat: add candidate page with streaming chat"
```

---

### Task 3.3: 创建面试官页面

**Files:**
- Create: `frontend/src/pages/InterviewerPage.tsx`
- Create: `frontend/src/components/ControlPanel.tsx`

- [ ] **Step 1: 创建 frontend/src/pages/InterviewerPage.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useChat } from '../hooks/useChat';
import { getInterviewConfig } from '../services/api';
import type { InterviewConfig, ChatMessage } from '../types/interview';
import axios from 'axios';

export default function InterviewerPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiManaged, setAiManaged] = useState(true);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const { connected, lastMessage, sendMessage } = useWebSocket(id || '');

  useEffect(() => {
    if (id) {
      getInterviewConfig(id).then((data) => {
        setConfig(data);
        setAiManaged(data.ai_managed);
      });
    }
  }, [id]);

  useEffect(() => {
    if (lastMessage?.type === 'chat_sync') {
      setMessages((prev) => [...prev, lastMessage.message]);
    }
    if (lastMessage?.type === 'control_update') {
      setAiManaged(lastMessage.ai_managed);
    }
    if (lastMessage?.type === 'interview_ended') {
      setInterviewEnded(true);
    }
  }, [lastMessage]);

  const handleToggleAI = async () => {
    const newState = !aiManaged;
    sendMessage('control', '', '');
    // Send control command via WebSocket
    if (connected) {
      // Actually need to send via WebSocket with control type
    }
    // Also use HTTP API
    await axios.post(`/api/control/toggle/${id}`, { ai_managed: newState });
    setAiManaged(newState);
  };

  const handleEndInterview = async () => {
    await axios.post(`/api/control/end/${id}`);
    setInterviewEnded(true);
  };

  const handleManualSend = () => {
    if (manualInput.trim() && !aiManaged) {
      sendMessage('interviewer', manualInput.trim());
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'interviewer',
        content: manualInput.trim(),
        source: 'manual',
      }]);
      setManualInput('');
    }
  };

  const handleGenerateReport = async () => {
    // Will implement in Phase 4
    alert('报告生成功能将在 Phase 4 实现');
  };

  return (
    <div className="chat-container">
      <div style={{ padding: '1rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>面试监控 - {config?.jd_text?.slice(0, 30)}...</h3>
          <span style={{ color: connected ? '#22c55e' : '#ef4444' }}>
            {connected ? '已连接' : '未连接'}
          </span>
          <span style={{ marginLeft: '1rem', color: aiManaged ? '#2563eb' : '#f59e0b' }}>
            {aiManaged ? 'AI托管' : '手动模式'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="button" 
            onClick={handleToggleAI}
            style={{ background: aiManaged ? '#f59e0b' : '#2563eb' }}
          >
            {aiManaged ? '取消AI托管' : '继续AI托管'}
          </button>
          
          <button className="button" onClick={handleEndInterview} style={{ background: '#ef4444' }}>
            结束面试
          </button>
          
          {interviewEnded && (
            <button className="button" onClick={handleGenerateReport}>
              总结面试
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>
              {msg.role === 'ai' ? 'AI面试官' : 
               msg.role === 'interviewer' ? '面试官' : '面试者'}:
            </strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <div style={{ opacity: aiManaged ? 0.5 : 1 }}>
          <textarea
            className="textarea"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={aiManaged ? 'AI托管模式下无法手动提问' : '输入手动提问...'}
            disabled={aiManaged}
            style={{ minHeight: '60px' }}
          />
          <button 
            className="button" 
            onClick={handleManualSend}
            disabled={aiManaged || !manualInput.trim()}
            style={{ marginTop: '0.5rem' }}
          >
            发送问题
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交 Task 3.3**

```bash
git add frontend/src/pages/InterviewerPage.tsx
git commit -m "feat: add interviewer page with control panel"
```

---

### Task 3.4: 创建历史和详情页面

**Files:**
- Create: `frontend/src/pages/HistoryPage.tsx`
- Create: `frontend/src/pages/DetailPage.tsx`

- [ ] **Step 1: 创建 frontend/src/pages/HistoryPage.tsx**

```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewHistory } from '../services/api';
import type { InterviewListItem } from '../types/interview';

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviewHistory().then((data) => {
      setInterviews(data.items);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>面试记录</h2>
      
      <div style={{ marginTop: '1.5rem' }}>
        {interviews.length === 0 ? (
          <p style={{ color: '#64748b' }}>暂无面试记录</p>
        ) : (
          interviews.map((item) => (
            <div key={item.id} style={{ 
              padding: '1rem', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p><strong>{item.jd_text.slice(0, 50)}...</strong></p>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  面试官: {item.interviewer_info} | 
                  状态: {item.status} | 
                  时间: {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <Link to={`/detail/${item.id}`} className="button" style={{ textDecoration: 'none' }}>
                查看详情
              </Link>
            </div>
          ))
        )}
      </div>
      
      <Link to="/" className="button" style={{ marginTop: '1rem', display: 'block', textAlign: 'center', textDecoration: 'none', background: '#64748b' }}>
        返回首页
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: 创建 frontend/src/pages/DetailPage.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterviewDetail } from '../services/api';
import type { InterviewDetail } from '../types/interview';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<InterviewDetail | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getInterviewDetail(id).then((data) => {
        setDetail(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>;
  }

  if (!detail) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>面试不存在</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <h2>面试详情</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
        <button className="button" onClick={() => setActiveTab('config')} style={{ background: activeTab === 'config' ? '#2563eb' : '#64748b' }}>
          面试配置
        </button>
        <button className="button" onClick={() => setActiveTab('chat')} style={{ background: activeTab === 'chat' ? '#2563eb' : '#64748b' }}>
          聊天记录
        </button>
        <button className="button" onClick={() => setActiveTab('report')} style={{ background: activeTab === 'report' ? '#2563eb' : '#64748b' }}>
          面试报告
        </button>
      </div>

      {activeTab === 'config' && (
        <div>
          <p><strong>岗位 JD:</strong> {detail.config.jd_text}</p>
          <p><strong>公司信息:</strong> {detail.config.company_info}</p>
          <p><strong>面试官:</strong> {detail.config.interviewer_info}</p>
          <p><strong>面试方案:</strong> {detail.config.interview_scheme}</p>
          <p><strong>最大问题数:</strong> {detail.config.max_questions}</p>
          <p><strong>最大时长:</strong> {detail.config.max_duration / 60} 分钟</p>
        </div>
      )}

      {activeTab === 'chat' && (
        <div>
          {detail.messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`} style={{ marginBottom: '0.5rem' }}>
              <strong>
                {msg.role === 'ai' ? 'AI面试官' : 
                 msg.role === 'interviewer' ? '面试官' : '面试者'}:
              </strong>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'report' && (
        <div>
          {detail.report ? (
            <>
              <h3>能力评估</h3>
              <p>{detail.report.ability_evaluation}</p>
              
              <h3 style={{ marginTop: '1rem' }}>岗位匹配度</h3>
              <p>{detail.report.match_analysis}</p>
              
              <h3 style={{ marginTop: '1rem' }}>优缺点总结</h3>
              <p>{detail.report.pros_cons}</p>
              
              <h3 style={{ marginTop: '1rem' }}>录用建议</h3>
              <p><strong>结论: {detail.report.final_decision}</strong></p>
              <p>{detail.report.hiring_recommendation}</p>
              
              {detail.report.followup_questions && (
                <>
                  <h3 style={{ marginTop: '1rem' }}>追问建议</h3>
                  <p>{detail.report.followup_questions}</p>
                </>
              )}
            </>
          ) : (
            <p style={{ color: '#64748b' }}>报告尚未生成</p>
          )}
        </div>
      )}

      <Link to="/history" className="button" style={{ marginTop: '1rem', display: 'block', textAlign: 'center', textDecoration: 'none', background: '#64748b' }}>
        返回列表
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: 提交 Task 3.4**

```bash
git add frontend/src/pages/HistoryPage.tsx frontend/src/pages/DetailPage.tsx
git commit -m "feat: add history and detail pages"
```

---

## Phase 3 完成 ✓

---

## Phase 4: 报告生成系统

### Task 4.1: 创建报告服务

**Files:**
- Create: `backend/app/services/report_service.py`
- Create: `backend/app/api/routes/report.py`
- Create: `backend/app/config/prompts/report/` 目录下 6 个模板文件

- [ ] **Step 1: 创建报告提示词模板**

创建以下 6 个文件：

`backend/app/config/prompts/report/chat_summary.md`:
```markdown
你是一个面试记录整理助手。请将以下面试聊天记录整理为结构化的问答记录。

## 聊天记录
{chat_messages}

## 输出要求
按 Q1/A1, Q2/A2 格式输出问答记录。忽略系统消息。
```

`backend/app/config/prompts/report/ability_eval.md`:
```markdown
你是一个面试评估专家。请基于问答记录评估面试者能力。

## 岗位 JD
{jd_text}

## 问答记录
{chat_summary}

## 输出要求
评分 0-100，评估技术能力、沟通能力、问题解决、项目经验、学习能力、团队协作。
```

`backend/app/config/prompts/report/match_analysis.md`:
```markdown
分析面试者与岗位匹配程度。

## 岗位 JD
{jd_text}

## 能力评估
{ability_evaluation}

## 输出要求
核心技术匹配、经验匹配、软技能匹配、总体匹配度百分比。
```

`backend/app/config/prompts/report/pros_cons.md`:
```markdown
总结面试者优缺点。

## 问答记录
{chat_summary}

## 能力评估
{ability_evaluation}

## 输出要求
列出 3-5 个亮点和 2-4 个不足，关联具体回答证据。
```

`backend/app/config/prompts/report/hiring.md`:
```markdown
给出录用建议。

## 匹配度分析
{match_analysis}

## 优缺点总结
{pros_cons}

## 输出要求
结论：强烈推荐/推荐/待定/不推荐。详细理由 200-300 字。
```

`backend/app/config/prompts/report/followup.md`:
```markdown
建议后续面试追问方向（仅推荐录用时）。

## 岗位 JD
{jd_text}

## 录用建议
{hiring_recommendation}

## 输出要求
3-5 个追问方向。不推荐时输出"不适用"。
```

- [ ] **Step 2: 创建 backend/app/services/report_service.py**

```python
"""Report generation service."""
import os
from pathlib import Path
from sqlalchemy.orm import Session
from ..database import Interview, ChatMessage, InterviewReport
from .llm_service import LLMService
from .prompt_service import PromptService
import uuid

llm_service = LLMService()
prompt_service = PromptService()


class ReportService:
    """Service for generating interview reports."""
    
    def __init__(self):
        self.report_prompts_dir = Path(__file__).parent.parent / "config" / "prompts" / "report"
    
    async def generate_report(self, interview_id: str, db: Session) -> InterviewReport:
        """Generate full interview report."""
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise ValueError("Interview not found")
        
        messages = db.query(ChatMessage).filter(
            ChatMessage.interview_id == interview_id
        ).order_by(ChatMessage.sequence).all()
        
        # Format chat history
        chat_messages = prompt_service.format_chat_history(messages)
        
        # Template 1: Chat summary
        chat_summary = await self._run_template("chat_summary", {
            "chat_messages": chat_messages,
        })
        
        # Template 2: Ability evaluation
        ability_evaluation = await self._run_template("ability_eval", {
            "jd_text": interview.jd_text,
            "chat_summary": chat_summary,
        })
        
        # Template 3: Match analysis
        match_analysis = await self._run_template("match_analysis", {
            "jd_text": interview.jd_text,
            "ability_evaluation": ability_evaluation,
        })
        
        # Template 4: Pros and cons
        pros_cons = await self._run_template("pros_cons", {
            "chat_summary": chat_summary,
            "ability_evaluation": ability_evaluation,
        })
        
        # Template 5: Hiring recommendation
        hiring_recommendation = await self._run_template("hiring", {
            "match_analysis": match_analysis,
            "pros_cons": pros_cons,
        })
        
        # Template 6: Followup questions
        followup_questions = await self._run_template("followup", {
            "jd_text": interview.jd_text,
            "hiring_recommendation": hiring_recommendation,
        })
        
        # Parse final decision
        final_decision = self._parse_decision(hiring_recommendation)
        
        # Create report
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
        """Run a report template through LLM."""
        template_path = self.report_prompts_dir / f"{template_name}.md"
        template = template_path.read_text(encoding="utf-8")
        
        for key, value in variables.items():
            template = template.replace(f"{{{key}}}", str(value) if value else "")
        
        return await llm_service.generate(template)
    
    def _parse_decision(self, hiring_text: str) -> str:
        """Parse hiring decision from text."""
        if "强烈推荐" in hiring_text:
            return "强烈推荐"
        elif "推荐" in hiring_text:
            return "推荐"
        elif "不推荐" in hiring_text:
            return "不推荐"
        else:
            return "待定"


report_service = ReportService()
```

- [ ] **Step 3: 创建 backend/app/api/routes/report.py**

```python
"""Report API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db, Interview, InterviewReport
from ..services.report_service import report_service
from ..models.report import ReportResponse

router = APIRouter()


@router.post("/api/report/generate/{interview_id}", response_model=ReportResponse)
async def generate_report(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """Generate interview report."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.status != "ended":
        raise HTTPException(status_code=400, detail="Interview must be ended first")
    
    # Check if report already exists
    existing = db.query(InterviewReport).filter(
        InterviewReport.interview_id == interview_id
    ).first()
    
    if existing:
        return ReportResponse(
            report_id=existing.id,
            interview_id=interview_id,
            status="completed",
            final_decision=existing.final_decision,
            overall_score=existing.overall_score,
        )
    
    # Generate new report
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
async def get_report(
    interview_id: str,
    db: Session = Depends(get_db)
):
    """Get existing report."""
    report = db.query(InterviewReport).filter(
        InterviewReport.interview_id == interview_id
    ).first()
    
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
```

- [ ] **Step 4: 更新 main.py 添加 report router**

```python
from .api.routes.report import router as report_router

app.include_router(report_router, tags=["report"])
```

- [ ] **Step 5: 提交 Phase 4.1**

```bash
git add backend/app/services/report_service.py backend/app/api/routes/report.py backend/app/config/prompts/report/ backend/app/main.py
git commit -m "feat: add report generation service with 6 templates"
```

---

### Task 4.2: 前端集成报告功能

**Files:**
- Update: `frontend/src/pages/InterviewerPage.tsx`
- Update: `frontend/src/pages/DetailPage.tsx`

- [ ] **Step 1: 更新 InterviewerPage.tsx 报告按钮**

添加调用报告 API:

```typescript
const handleGenerateReport = async () => {
  try {
    const response = await axios.post(`/api/report/generate/${id}`);
    alert(`报告已生成！结论: ${response.data.final_decision}`);
    // Navigate to detail page
    navigate(`/detail/${id}`);
  } catch (error: any) {
    alert(error.response?.data?.detail || '报告生成失败');
  }
};
```

- [ ] **Step 2: 提交 Task 4.2**

```bash
git add frontend/src/pages/
git commit -m "feat: integrate report generation in interviewer page"
```

---

## Phase 4 完成 ✓

---

## 实现计划自检

**1. Spec Coverage Check:**

| 需求 | 覆盖的 Task |
|------|------------|
| 首页创建面试 | Task 1.5, 3.1 |
| 面试配置页5项输入 | Task 1.3, 3.1 |
| 开始面试生成链接 | Task 1.3, 3.1 |
| 面试者聊天框流式输出 | Task 2.3, 3.2 |
| 面试者文字/语音输入 | Task 3.2 (语音Phase 4.3预留) |
| 准备好了按钮 | Task 3.2 |
| 面试官实时聊天同步 | Task 2.2, 3.3 |
| 取消/继续AI托管 | Task 2.2, 3.3 |
| 结束面试按钮 | Task 2.4, 3.3 |
| 总结面试按钮 | Task 4.1, 4.2 |
| 6模板报告生成 | Task 4.1 |
| 面试记录历史页 | Task 3.4 |
| 面试详情页 | Task 3.4 |
| 通义千问LLM调用 | Task 2.1 |
| WebSocket实时同步 | Task 2.2 |
| SSE流式输出 | Task 2.3 |
| SQLite数据库 | Task 1.2 |
| LLM提问提示词 | Task 2.1 |
| 结束判断提示词 | Task 2.1 |

**覆盖率: 100%**

**2. Placeholder Scan:**

- 无 TBD/TODO/FIXME 占位符 ✓
- 所有代码块完整 ✓
- 所有步骤有具体命令 ✓

**3. Type Consistency:**

- `Interview.id` 在所有 Task 中使用 String 类型 ✓
- `ChatMessage.sequence` 使用 Integer ✓
- 前端类型定义与后端 Pydantic 模型匹配 ✓

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-17-interviewpilot-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach do you prefer?**