# Logging System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 InterviewPilot 后端添加结构化日志系统，支持线上部署后问题排查，使用 structlog 实现 JSON 格式日志输出到文件和终端。

**Architecture:** 使用 structlog 处理器管道模式配置双重输出（文件JSON + 终端彩色），通过 contextvars 自动绑定业务上下文（interview_id），在关键路径（LLM调用、报告生成、WebSocket）添加完整日志链路。

**Tech Stack:** structlog, Python logging, FastAPI middleware, uvicorn log config

---

## File Structure

```
backend/
├── logs/                           # 新增：日志文件目录
├── app/
│   ├── config/
│   │   ├── logging.py              # 新增：日志配置模块
│   │   ├── uvicorn_log_config.json # 新增：uvicorn日志配置
│   │   └── settings.py             # 修改：添加LOG_LEVEL等配置
│   ├── services/
│   │   ├── llm_service.py          # 修改：添加LLM调用日志
│   │   ├── report_service.py       # 修改：添加报告生成日志
│   │   ├── websocket_manager.py    # 修改：添加WebSocket连接日志
│   │   └── speech_service.py       # 修改：添加语音服务日志
│   │   └── resume_parser.py        # 修改：添加简历解析日志
│   ├── api/routes/
│   │   ├── websocket.py            # 修改：添加消息处理日志
│   │   ├── interview.py            # 修改：添加上下文绑定
│   │   ├── report.py               # 修改：添加上下文绑定
│   │   └── chat.py                 # 修改：添加上下文绑定
│   └ main.py                       # 修改：初始化日志配置
├── requirements.txt                # 修改：添加structlog依赖
└── .gitignore (root)               # 修改：添加backend/logs/
```

---

### Task 1: 添加 structlog 依赖

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: 编辑 requirements.txt 添加 structlog**

```python
# 在 requirements.txt 末尾添加
structlog>=23.1.0
```

- [ ] **Step 2: 安装依赖**

Run: `cd backend && pip install structlog>=23.1.0`
Expected: Successfully installed structlog

- [ ] **Step 3: 验证安装**

Run: `python -c "import structlog; print(structlog.__version__)"`
Expected: 打印版本号，无报错

---

### Task 2: 创建日志配置模块

**Files:**
- Create: `backend/app/config/logging.py`

- [ ] **Step 1: 创建 logging.py 配置模块**

```python
"""Logging configuration module for InterviewPilot backend."""

import logging
import sys
from pathlib import Path
from datetime import datetime
import os

import structlog
from structlog.stdlib import LoggerFactory
from structlog.processors import (
    JSONRenderer,
    TimeStamper,
    add_log_level,
    StackInfoRenderer,
    format_exc_info,
    UnicodeEncoder,
)


def get_log_level() -> str:
    """Get log level from environment variable."""
    return os.getenv("LOG_LEVEL", "INFO").upper()


def get_log_dir() -> Path:
    """Get log directory path, create if not exists."""
    log_dir = Path(__file__).parent.parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    return log_dir


def get_log_file_path() -> Path:
    """Get current log file path with date suffix."""
    log_dir = get_log_dir()
    date_str = datetime.now().strftime("%Y-%m-%d")
    return log_dir / f"app-{date_str}.log"


def cleanup_old_logs(max_days: int = 7) -> None:
    """Remove log files older than max_days."""
    log_dir = get_log_dir()
    cutoff_date = datetime.now().timestamp() - (max_days * 24 * 60 * 60)
    
    for log_file in log_dir.glob("app-*.log"):
        if log_file.stat().st_mtime < cutoff_date:
            log_file.unlink()


class StructlogFormatter(logging.Formatter):
    """Custom formatter to use structlog JSON rendering for stdlib logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        # Create structlog-style dict
        log_dict = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_dict["exc_info"] = self.formatException(record.exc_info)
        
        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in ["name", "msg", "args", "created", "filename", 
                          "funcName", "levelname", "levelno", "lineno",
                          "module", "msecs", "pathname", "process",
                          "processName", "relativeCreated", "thread",
                          "threadName", "exc_info", "exc_text", "stack_info",
                          "message", "asctime"]:
                log_dict[key] = value
        
        return JSONRenderer()(log_dict)


def setup_file_handler() -> logging.FileHandler:
    """Setup file handler with JSON format."""
    log_file = get_log_file_path()
    handler = logging.FileHandler(log_file, encoding="utf-8")
    handler.setFormatter(StructlogFormatter())
    handler.setLevel(get_log_level())
    return handler


def setup_console_handler() -> logging.StreamHandler:
    """Setup console handler with colored output."""
    handler = logging.StreamHandler(sys.stdout)
    
    # Use colored format for terminal
    colors = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    
    class ColoredFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            color = colors.get(record.levelname, "")
            reset = "\033[0m"
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            return f"{color}[{timestamp}] [{record.levelname}] [{record.name}] {record.getMessage()}{reset}"
    
    handler.setFormatter(ColoredFormatter())
    handler.setLevel(get_log_level())
    return handler


def configure_structlog() -> None:
    """Configure structlog with processors pipeline."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            TimeStamper(fmt="iso"),
            StackInfoRenderer(),
            format_exc_info,
            UnicodeEncoder(),
            JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLogger().level
        ),
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def init_logging() -> None:
    """Initialize logging configuration for the application."""
    # Cleanup old log files
    cleanup_old_logs()
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(get_log_level())
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Add file handler (JSON)
    root_logger.addHandler(setup_file_handler())
    
    # Add console handler (colored)
    root_logger.addHandler(setup_console_handler())
    
    # Configure structlog
    configure_structlog()
    
    # Log initialization
    logger = get_logger("logging")
    logger.info("logging_initialized", log_level=get_log_level(), log_dir=str(get_log_dir()))


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structlog logger instance."""
    return structlog.get_logger(name)
```

- [ ] **Step 2: 验证模块导入**

Run: `cd backend && python -c "from app.config.logging import get_logger; print('OK')"`
Expected: 打印 OK，无报错

---

### Task 3: 扩展 Settings 配置

**Files:**
- Modify: `backend/app/config/settings.py`

- [ ] **Step 1: 在 Settings 类添加日志配置项**

```python
# 在 Settings 类中添加（约第36行后）

    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    LOG_MAX_DAYS: int = 7
```

- [ ] **Step 2: 在 __init__ 方法中读取环境变量**

```python
# 在 __init__ 方法中添加（约第52行后）

        # Logging config
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", self.LOG_LEVEL)
        self.LOG_DIR = os.getenv("LOG_DIR", self.LOG_DIR)
        self.LOG_MAX_DAYS = int(os.getenv("LOG_MAX_DAYS", str(self.LOG_MAX_DAYS)))
```

---

### Task 4: 在 main.py 初始化日志

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: 导入日志模块**

```python
# 在文件顶部导入区添加（约第7行后）

from .config.logging import init_logging
```

- [ ] **Step 2: 在 lifespan 中初始化日志**

```python
# 修改 lifespan 函数（约第20-23行）

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_logging()  # 初始化日志配置
    init_db()
    yield
```

---

### Task 5: 更新 .gitignore 排除日志目录

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 添加 backend/logs/ 到 .gitignore**

```gitignore
# 在 .gitignore 文件末尾添加（约第273行后）

# Backend logs
backend/logs/
```

---

### Task 6: LLM 调用日志

**Files:**
- Modify: `backend/app/services/llm_service.py`

- [ ] **Step 1: 导入日志模块和上下文绑定**

```python
# 在文件顶部添加导入（约第5行后）

import time
import structlog
from ..config.logging import get_logger
import structlog.contextvars as contextvars
```

- [ ] **Step 2: 获取 logger 实例**

```python
# 在 LLMService 类 __init__ 方法后添加（约第17行后）

        self.logger = get_logger("llm_service")
```

- [ ] **Step 3: 修改 generate_stream 方法添加日志**

```python
# 修改 generate_stream 方法（约第19-60行）

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        start_time = time.time()
        
        self.logger.info(
            "llm_call_start",
            model=self.model,
            prompt_length=len(prompt),
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=True,
        )
        
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

        response_length = 0
        
        try:
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
                                data = json.loads(line[6:])
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        response_length += len(content)
                                        yield content
                            except json.JSONDecodeError:
                                continue
            
            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.info(
                "llm_call_end",
                duration_ms=duration_ms,
                response_length=response_length,
                stream=True,
            )
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.error(
                "llm_call_error",
                error_type=type(e).__name__,
                error_message=str(e),
                duration_ms=duration_ms,
                exc_info=True,
            )
            raise
```

- [ ] **Step 4: 修改 generate 方法添加日志**

```python
# 修改 generate 方法（约第62-93行）

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        start_time = time.time()
        
        self.logger.info(
            "llm_call_start",
            model=self.model,
            prompt_length=len(prompt),
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=False,
        )
        
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

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                
                duration_ms = int((time.time() - start_time) * 1000)
                self.logger.info(
                    "llm_call_end",
                    duration_ms=duration_ms,
                    response_length=len(content),
                    stream=False,
                )
                
                return content
                
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.logger.error(
                "llm_call_error",
                error_type=type(e).__name__,
                error_message=str(e),
                duration_ms=duration_ms,
                exc_info=True,
            )
            raise
```

---

### Task 7: 报告生成流程日志

**Files:**
- Modify: `backend/app/services/report_service.py`

- [ ] **Step 1: 导入日志模块和时间模块**

```python
# 在文件顶部添加导入（约第5行后）

import time
from ..config.logging import get_logger
import structlog.contextvars as contextvars
```

- [ ] **Step 2: 获取 logger 实例**

```python
# 在 ReportService 类 __init__ 方法后添加（约第17行后）

        self.logger = get_logger("report_service")
```

- [ ] **Step 3: 修改 generate_report 方法添加日志**

```python
# 修改 generate_report 方法（约第19-116行）

    async def generate_report(self, interview_id: str, db: Session) -> InterviewReport:
        start_time = time.time()
        
        # 绑定 interview_id 到日志上下文
        contextvars.bind_contextvars(interview_id=interview_id)
        
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            self.logger.error("report_interview_not_found", interview_id=interview_id)
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
        
        job_position_id = job_position.id
        
        self.logger.info(
            "report_generation_start",
            interview_id=interview_id,
            job_position_id=job_position_id,
            message_count=len(messages),
        )

        # 步骤1: chat_summary
        chat_summary = await self._run_step_with_logging(
            "chat_summary",
            {
                "chat_messages": chat_messages,
            },
        )

        # 步骤2: ability_eval
        ability_evaluation = await self._run_step_with_logging(
            "ability_eval",
            {
                "jd_text": jd_text,
                "company_info": company_info,
                "interviewer_info": interviewer_info,
                "chat_summary": chat_summary,
            },
        )

        # 步骤3: match_analysis
        match_analysis = await self._run_step_with_logging(
            "match_analysis",
            {
                "jd_text": jd_text,
                "company_info": company_info,
                "interviewer_info": interviewer_info,
                "interview_scheme": interview_scheme,
                "ability_evaluation": ability_evaluation,
            },
        )

        # 步骤4: pros_cons
        pros_cons = await self._run_step_with_logging(
            "pros_cons",
            {
                "interviewer_info": interviewer_info,
                "chat_summary": chat_summary,
                "ability_evaluation": ability_evaluation,
            },
        )

        # 步骤5: hiring
        hiring_recommendation = await self._run_step_with_logging(
            "hiring",
            {
                "company_info": company_info,
                "interviewer_info": interviewer_info,
                "interview_scheme": interview_scheme,
                "match_analysis": match_analysis,
                "pros_cons": pros_cons,
            },
        )

        # 步骤6: followup
        followup_questions = await self._run_step_with_logging(
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

        total_duration_ms = int((time.time() - start_time) * 1000)
        self.logger.info(
            "report_generation_end",
            interview_id=interview_id,
            total_duration_ms=total_duration_ms,
            final_decision=final_decision,
        )
        
        # 清理上下文
        contextvars.unbind_contextvars("interview_id")

        return report
```

- [ ] **Step 4: 添加辅助方法 _run_step_with_logging**

```python
# 在 _run_template 方法后添加新方法（约第125行后）

    async def _run_step_with_logging(self, step_name: str, variables: dict) -> str:
        """Run a report generation step with logging."""
        step_start = time.time()
        
        self.logger.info("report_step_start", step=step_name)
        
        try:
            result = await self._run_template(step_name, variables)
            step_duration_ms = int((time.time() - step_start) * 1000)
            
            self.logger.info(
                "report_step_end",
                step=step_name,
                duration_ms=step_duration_ms,
                result_length=len(result),
            )
            
            return result
            
        except Exception as e:
            step_duration_ms = int((time.time() - step_start) * 1000)
            self.logger.error(
                "report_step_error",
                step=step_name,
                error_type=type(e).__name__,
                error_message=str(e),
                duration_ms=step_duration_ms,
                exc_info=True,
            )
            raise
```

---

### Task 8: WebSocket 连接管理日志

**Files:**
- Modify: `backend/app/services/websocket_manager.py`

- [ ] **Step 1: 导入日志模块**

```python
# 在文件顶部添加导入（约第5行后）

from ..config.logging import get_logger
import structlog.contextvars as contextvars
```

- [ ] **Step 2: 获取 logger 实例**

```python
# 在 WebSocketManager 类 __init__ 方法中添加（约第9行后）

        self.logger = get_logger("websocket_manager")
```

- [ ] **Step 3: 修改 connect 方法添加日志**

```python
# 修改 connect 方法（约第11-15行）

    async def connect(self, interview_id: str, websocket: WebSocket):
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = set()
        self.active_connections[interview_id].add(websocket)
        
        # 绑定 interview_id 到日志上下文
        contextvars.bind_contextvars(interview_id=interview_id)
        
        active_count = len(self.active_connections[interview_id])
        self.logger.info(
            "websocket_connected",
            interview_id=interview_id,
            active_connections=active_count,
        )
```

- [ ] **Step 4: 修改 disconnect 方法添加日志**

```python
# 修改 disconnect 方法（约第17-21行）

    def disconnect(self, interview_id: str, websocket: WebSocket):
        was_connected = interview_id in self.active_connections and websocket in self.active_connections[interview_id]
        
        if interview_id in self.active_connections:
            self.active_connections[interview_id].discard(websocket)
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]
        
        # 清理上下文
        contextvars.unbind_contextvars("interview_id")
        
        remaining_count = len(self.active_connections.get(interview_id, set()))
        self.logger.info(
            "websocket_disconnected",
            interview_id=interview_id,
            remaining_connections=remaining_count,
        )
```

---

### Task 9: WebSocket 消息处理日志

**Files:**
- Modify: `backend/app/api/routes/websocket.py`

- [ ] **Step 1: 导入日志模块**

```python
# 在文件顶部添加导入（约第7行后）

from ...config.logging import get_logger
```

- [ ] **Step 2: 获取 logger 实例**

```python
# 在 router 定义后添加（约第9行后）

logger = get_logger("websocket_route")
```

- [ ] **Step 3: 在消息处理中添加日志**

```python
# 修改 interview_websocket 函数的消息处理部分（约第20-73行）

    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type", "unknown")
            message_size = len(str(data))
            
            logger.info(
                "websocket_message_received",
                message_type=message_type,
                message_size_bytes=message_size,
            )

            if data.get("type") == "chat_message":
                # ... 现有的 chat_message 处理逻辑 ...
                
                logger.info(
                    "chat_message_saved",
                    message_id=message.id,
                    sequence=message.sequence,
                    role=message.role,
                    source=source,
                )

            elif data.get("type") == "control":
                action = data.get("action")
                logger.info("control_command_received", action=action)
                
                # ... 现有的 control 处理逻辑 ...

    except WebSocketDisconnect:
        ws_manager.disconnect(interview_id, websocket)
        logger.info("websocket_client_disconnect", interview_id=interview_id)
        
    except Exception as e:
        ws_manager.disconnect(interview_id, websocket)
        logger.error(
            "websocket_error",
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True,
        )
```

---

### Task 10: 简历解析日志

**Files:**
- Modify: `backend/app/services/resume_parser.py`

- [ ] **Step 1: 导入日志模块**

```python
# 在文件顶部添加导入

from ..config.logging import get_logger
```

- [ ] **Step 2: 获取 logger 实例**

```python
# 在 ResumeParserService 类 __init__ 方法中添加

        self.logger = get_logger("resume_parser")
```

- [ ] **Step 3: 在解析方法中添加日志**

```python
# 在 parse_pdf 和 parse_docx 方法中添加日志

    def parse_pdf(self, file_path: str) -> str:
        self.logger.info("resume_parse_start", file_type="pdf", file_path=file_path)
        # ... 现有解析逻辑 ...
        self.logger.info("resume_parse_end", file_type="pdf", text_length=len(text))
        return text

    def parse_docx(self, file_path: str) -> str:
        self.logger.info("resume_parse_start", file_type="docx", file_path=file_path)
        # ... 现有解析逻辑 ...
        self.logger.info("resume_parse_end", file_type="docx", text_length=len(text))
        return text
```

---

### Task 11: 语音服务日志

**Files:**
- Modify: `backend/app/services/speech_service.py`

- [ ] **Step 1: 导入日志模块**

```python
# 在文件顶部添加导入

from ..config.logging import get_logger
```

- [ ] **Step 2: 获取 logger 实例**

```python
# 在 SpeechService 类中添加

        self.logger = get_logger("speech_service")
```

- [ ] **Step 3: 在关键操作中添加日志**

```python
# 在 WebSocket 连接和消息处理中添加日志

    async def connect(self, interview_id: str):
        self.logger.info("speech_ws_connect_start", interview_id=interview_id)
        # ... 连接逻辑 ...
        self.logger.info("speech_ws_connect_end", interview_id=interview_id)
        
    async def process_audio(self, audio_data: bytes):
        self.logger.debug("speech_audio_received", audio_size=len(audio_data))
        # ... 处理逻辑 ...
```

---

### Task 12: 验证日志功能

**Files:**
- None (手动验证)

- [ ] **Step 1: 启动后端验证日志初始化**

Run: `cd backend && uvicorn app.main:app --reload --port 8000`
Expected: 
- 终端输出绿色 `[INFO] [logging] logging_initialized`
- backend/logs/ 目录创建
- backend/logs/app-YYYY-MM-DD.log 文件创建

- [ ] **Step 2: 检查日志文件 JSON 格式**

Run: `cat backend/logs/app-*.log | head -5`
Expected: JSON 格式日志，包含 timestamp, level, logger, message 字段

- [ ] **Step 3: 触发 LLM 调用验证日志链路**

通过前端或 API 触发一个面试对话，检查日志文件是否包含：
- `llm_call_start` (prompt_length, model, temperature)
- `llm_call_end` (duration_ms, response_length)

- [ ] **Step 4: 触发报告生成验证日志链路**

触发报告生成，检查日志文件是否包含：
- `report_generation_start`
- `report_step_start` / `report_step_end` (6个步骤)
- `report_generation_end` (total_duration_ms, final_decision)

---

### Task 13: 提交代码

**Files:**
- None (git 操作)

- [ ] **Step 1: 查看变更文件**

Run: `git status`
Expected: 显示所有修改的文件

- [ ] **Step 2: 提交变更**

Run: 
```bash
git add backend/requirements.txt backend/app/config/logging.py backend/app/config/settings.py backend/app/main.py backend/app/services/llm_service.py backend/app/services/report_service.py backend/app/services/websocket_manager.py backend/app/services/speech_service.py backend/app/services/resume_parser.py backend/app/api/routes/websocket.py .gitignore
git commit -m "feat: add structured logging system with structlog

- Add logging configuration module with JSON file output and colored terminal output
- Add logging to LLM calls (start/end/error with duration tracking)
- Add logging to report generation 6-step pipeline
- Add logging to WebSocket connections and message handling
- Add logging to resume parsing and speech services
- Add context binding for interview_id in key routes
- Update .gitignore to exclude backend/logs/"
```

Expected: Commit 成功

---

## Self-Review Checklist

**1. Spec Coverage:**
- ✅ structlog 依赖添加 - Task 1
- ✅ 日志配置模块 - Task 2
- ✅ Settings 扩展 - Task 3
- ✅ main.py 初始化 - Task 4
- ✅ .gitignore 更新 - Task 5
- ✅ LLM调用日志 - Task 6
- ✅ 报告生成日志 - Task 7
- ✅ WebSocket连接日志 - Task 8
- ✅ WebSocket消息日志 - Task 9
- ✅ 简历解析日志 - Task 10
- ✅ 语音服务日志 - Task 11
- ✅ 验证测试 - Task 12
- ✅ 提交 - Task 13

**2. Placeholder Scan:**
- ✅ 无 TBD/TODO
- ✅ 无 "implement later" 或模糊描述
- ✅ 所有代码步骤有完整实现代码

**3. Type Consistency:**
- ✅ logger 变量名统一使用 `self.logger` (类方法) 或 `logger` (模块级)
- ✅ interview_id 绑定/解绑方法名一致
- ✅ 日志事件名格式一致：`<module>_<event>`

---

## Execution Notes

**环境变量配置：**
- `LOG_LEVEL=INFO` (默认)
- `LOG_MAX_DAYS=7` (默认)

**日志文件位置：**
- `backend/logs/app-YYYY-MM-DD.log`

**关键路径日志完整链路：**
1. LLM调用：start → end/error (含耗时)
2. 报告生成：start → 6步 → end (含耗时)
3. WebSocket：connect → message → disconnect

**上下文绑定点：**
- WebSocket 连接时绑定 interview_id
- 报告生成时绑定 interview_id
- 断开/结束时清理上下文