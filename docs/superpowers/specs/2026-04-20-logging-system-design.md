# InterviewPilot Logging System Design

**Date**: 2026-04-20
**Author**: Sisyphus
**Status**: Approved

## Summary

为 InterviewPilot 后端添加结构化日志系统，支持线上部署后的问题排查。使用 structlog 实现 JSON 格式日志输出到文件和终端，在关键业务路径（LLM调用、报告生成、WebSocket通信）添加日志埋点。

## Requirements

### 用户需求
- 日志输出目标：**文件 + 终端**（两者都要）
- 日志详细程度：**INFO级别**（适中，线上推荐）
- 关键路径优先：**LLM调用、报告生成流程、WebSocket通信**
- 日志格式：**结构化JSON**

### 功能目标
1. 统一的日志配置模块，易于维护
2. 双重输出：文件（JSON持久化）+ 终端（彩色文本）
3. 按日期分割日志文件，自动清理历史
4. 上下文绑定：interview_id 等业务ID自动附加到日志
5. 关键路径完整日志链路：调用入口→处理过程→出口→错误

## Architecture

### 日志框架选型

**使用 structlog**（推荐方案）

理由：
- 天然支持结构化JSON格式
- 处理器管道模式，灵活配置输出格式
- 上下文绑定（contextvars），业务ID自动附加
- 与标准库 logging 无缝集成
- FastAPI/uvicorn 社区成熟方案

### 目录结构

```
backend/
├── logs/                          # 日志文件目录（.gitignore）
│   └── app-2026-04-20.log        # 按日期分割
├── app/
│   └ config/
│   │   ├── logging.py            # 新增：日志配置模块
│   │   └── settings.py           # 修改：添加LOG_LEVEL配置
│   ├── services/
│   │   ├── llm_service.py        # 修改：添加LLM调用日志
│   │   ├── report_service.py     # 修改：添加报告生成日志
│   │   └ websocket_manager.py   # 修改：添加WebSocket日志
│   │   └ speech_service.py      # 修改：添加语音服务日志
│   │   └ resume_parser.py       # 修改：添加简历解析日志
│   └ main.py                     # 修改：初始化日志配置
```

## Components

### 1. 日志配置模块 (`config/logging.py`)

核心职责：
- 配置 structlog 处理器管道
- 设置双重输出处理器（文件JSON + 终端彩色）
- 提供 `get_logger(name)` 函数获取logger实例
- 集成 uvicorn 日志配置

配置要点：
```python
# 默认 INFO 级别
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# 文件处理器：JSON格式
file_handler = logging.FileHandler("logs/app-{date}.log")
file_handler.setFormatter(json_formatter)

# 终端处理器：彩色文本
console_handler = logging.StreamHandler()
console_handler.setFormatter(colored_formatter)

# structlog 配置
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,  # 自动绑定上下文
        structlog.stdlib.filter_by_level,         # 级别过滤
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeEncoder(),
        # 根据handler选择renderer
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.stdlib.LoggerFactory(),
)
```

### 2. Settings 扩展 (`config/settings.py`)

新增配置项：
```python
# Logging Settings
LOG_LEVEL: str = "INFO"           # DEBUG/INFO/WARNING/ERROR
LOG_DIR: str = "logs"             # 日志目录
LOG_MAX_DAYS: int = 7             # 日志保留天数
LOG_FORMAT: str = "json"          # json/text
```

### 3. 主入口初始化 (`main.py`)

在 FastAPI lifespan 中初始化日志：
```python
from .config.logging import init_logging

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_logging()  # 初始化日志配置
    init_db()
    yield
```

### 4. uvicorn 集成

启动命令添加日志配置：
```bash
uvicorn app.main:app --log-config app/config/uvicorn_log_config.json
```

或通过环境变量：
```python
# uvicorn_log_config.json
{
  "version": 1,
  "disable_existing_loggers": false,
  "formatters": {
    "default": {
      "()": "app.config.logging.StructlogFormatter"
    }
  },
  "handlers": {
    "default": {
      "formatter": "default",
      "class": "logging.StreamHandler"
    }
  },
  "loggers": {
    "uvicorn": {"handlers": ["default"], "level": "INFO"},
    "uvicorn.error": {"level": "INFO"},
    "uvicorn.access": {"handlers": ["default"], "level": "INFO"}
  }
}
```

## Key Path Logging Details

### 1. LLM调用日志 (`llm_service.py`)

日志点：
- **调用开始**：记录 prompt长度、model、temperature、max_tokens
- **调用结束**：记录 耗时(ms)、响应长度、token数（如可用）
- **调用错误**：记录 异常类型、HTTP状态码、错误消息

示例日志输出：
```json
{
  "timestamp": "2026-04-20T10:30:00Z",
  "level": "INFO",
  "logger": "llm_service",
  "event": "llm_call_start",
  "model": "qwen-plus",
  "prompt_length": 500,
  "temperature": 0.7,
  "interview_id": "abc123"
}
{
  "timestamp": "2026-04-20T10:30:05Z",
  "level": "INFO",
  "logger": "llm_service",
  "event": "llm_call_end",
  "duration_ms": 5000,
  "response_length": 800,
  "interview_id": "abc123"
}
{
  "timestamp": "2026-04-20T10:30:10Z",
  "level": "ERROR",
  "logger": "llm_service",
  "event": "llm_call_error",
  "error_type": "HTTPStatusError",
  "status_code": 429,
  "error_message": "Rate limit exceeded",
  "interview_id": "abc123"
}
```

### 2. 报告生成流程日志 (`report_service.py`)

报告生成6步流程：
1. chat_summary（聊天总结）
2. ability_eval（能力评估）
3. match_analysis（匹配分析）
4. pros_cons（优缺点）
5. hiring（录用建议）
6. followup（追问方向）

日志点：
- **整体开始**：记录 interview_id
- **每步开始/结束**：记录 步骤名、耗时
- **整体结束**：记录 总耗时、最终决策

示例日志：
```json
{
  "timestamp": "2026-04-20T10:35:00Z",
  "level": "INFO",
  "logger": "report_service",
  "event": "report_generation_start",
  "interview_id": "abc123",
  "job_position_id": "xyz789"
}
{
  "timestamp": "2026-04-20T10:35:05Z",
  "level": "INFO",
  "logger": "report_service",
  "event": "report_step_start",
  "step": "chat_summary",
  "interview_id": "abc123"
}
{
  "timestamp": "2026-04-20T10:35:10Z",
  "level": "INFO",
  "logger": "report_service",
  "event": "report_step_end",
  "step": "chat_summary",
  "duration_ms": 5000,
  "interview_id": "abc123"
}
{
  "timestamp": "2026-04-20T10:36:00Z",
  "level": "INFO",
  "logger": "report_service",
  "event": "report_generation_end",
  "total_duration_ms": 60000,
  "final_decision": "推荐",
  "interview_id": "abc123"
}
```

### 3. WebSocket通信日志 (`websocket_manager.py`, `websocket.py`)

日志点：
- **连接建立**：记录 interview_id、连接类型（interviewer/candidate）、当前连接数
- **消息处理**：记录 消息类型、interview_id、消息大小
- **连接断开**：记录 interview_id、断开原因
- **错误**：记录 异常类型、interview_id

示例日志：
```json
{
  "timestamp": "2026-04-20T10:40:00Z",
  "level": "INFO",
  "logger": "websocket_manager",
  "event": "websocket_connected",
  "interview_id": "abc123",
  "client_type": "interviewer",
  "active_connections": 2
}
{
  "timestamp": "2026-04-20T10:40:05Z",
  "level": "INFO",
  "logger": "websocket_manager",
  "event": "websocket_message_received",
  "message_type": "chat_sync",
  "interview_id": "abc123",
  "message_size_bytes": 256
}
{
  "timestamp": "2026-04-20T10:45:00Z",
  "level": "INFO",
  "logger": "websocket_manager",
  "event": "websocket_disconnected",
  "interview_id": "abc123",
  "client_type": "candidate",
  "active_connections": 1
}
```

### 4. 其他路径日志（可选）

**简历解析 (`resume_parser.py`)**：
- 文件上传：文件名、大小、类型
- 解析进度：提取方法、成功/失败
- 解析结果：提取文本长度

**语音识别 (`speech_service.py`)**：
- WebSocket代理连接：interview_id
- 音频流处理：数据包大小
- 转写结果：文本长度

## Context Binding Strategy

### 核心机制

使用 structlog contextvars 自动绑定业务上下文：
```python
import structlog.contextvars as contextvars

# 在路由入口绑定
@router.post("/api/interview/{interview_id}/start")
async def start_interview(interview_id: str):
    contextvars.bind_contextvars(interview_id=interview_id)
    # 后续所有日志自动包含 interview_id
    ...
    contextvars.unbind_contextvars("interview_id")  # 清理
```

### 关键绑定点

| 路由入口 | 绑定变量 |
|---------|---------|
| `/api/interview/{interview_id}/...` | `interview_id` |
| `/api/job-position/{job_position_id}` | `job_position_id` |
| WebSocket 连接 | `interview_id`, `client_type` |

### 清理策略

- 请求结束自动清理（FastAPI middleware）
- WebSocket断开时清理
- 避免上下文泄漏到其他请求

## Log File Management

### 文件命名

格式：`app-YYYY-MM-DD.log`
示例：`app-2026-04-20.log`

### 保留策略

- 保留最近 **7天** 日志文件
- 自动清理超过 `LOG_MAX_DAYS` 的文件
- 启动时检查并清理

### 目录管理

- 目录：`backend/logs/`
- `.gitignore` 排除：`logs/`
- 首次启动自动创建目录

## Error Handling

### 异常日志格式

```json
{
  "timestamp": "2026-04-20T10:50:00Z",
  "level": "ERROR",
  "logger": "llm_service",
  "event": "llm_call_error",
  "error_type": "HTTPStatusError",
  "error_message": "Rate limit exceeded",
  "stack_trace": "...",
  "interview_id": "abc123"
}
```

### 关键原则

- 所有异常必须记录完整 stack trace
- 使用 `exc_info=True` 自动捕获异常信息
- ERROR级别日志必须包含可操作的排查信息

## Testing Strategy

### 测试点

1. 日志配置初始化正确
2. 双重输出（文件+终端）工作正常
3. JSON格式正确性验证
4. 上下文绑定和清理正确
5. 日志级别过滤正确

### 测试方法

- 单元测试：验证日志配置函数
- 集成测试：验证API调用产生日志
- 手动验证：检查日志文件格式

## Deployment Considerations

### 环境变量

```bash
LOG_LEVEL=INFO              # 生产环境用INFO，调试用DEBUG
LOG_DIR=/var/log/interviewpilot  # 生产环境指定日志目录
LOG_MAX_DAYS=30             # 生产环境可延长保留时间
```

### 日志收集

JSON格式便于集成日志收集系统：
- ELK Stack（Elasticsearch + Logstash + Kibana）
- 阿里云日志服务 SLS
- 自建日志分析平台

### 性能影响

- structlog 性能开销小（<1ms/条）
- 文件写入异步化（可选）
- 高频场景可调整日志级别减少输出

## Implementation Plan

详见后续 implementation plan 文档（由 writing-plans skill 生成）。

主要步骤：
1. 添加 structlog 依赖
2. 创建日志配置模块
3. 集成到 main.py
4. 修改 llm_service.py 添加日志
5. 修改 report_service.py 添加日志
6. 修改 websocket 相关文件添加日志
7. 配置 uvicorn 日志集成
8. 更新 .gitignore
9. 测试验证

## Success Criteria

1. 后端启动后日志正常输出到文件和终端
2. LLM调用完整日志链路（开始→结束/错误）
3. 报告生成6步流程完整日志链路
4. WebSocket连接生命周期完整日志
5. 日志文件按日期分割，JSON格式正确
6. interview_id 上下文绑定正常工作
7. 环境变量 LOG_LEVEL 可动态调整日志级别