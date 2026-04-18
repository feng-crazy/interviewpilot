# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-18
**Commit:** 9043a9f
**Branch:** main

## OVERVIEW
企业AI面试智能体 - FastAPI后端 + React前端，使用阿里云DashScope (Qwen) LLM进行面试问答生成和人才画像分析。

## STRUCTURE
```
interviewpilot/
├── backend/app/          # FastAPI应用核心
│   ├── api/routes/       # REST + WebSocket路由
│   ├── services/         # 业务逻辑层 (LLM调用、报告生成)
│   ├── models/           # Pydantic请求/响应模型
│   ├── database/         # SQLAlchemy ORM模型和会话管理
│   └── config/prompts/   # LLM提示词模板 (.md文件)
├── frontend/src/         # React + Vite前端
│   ├── pages/            # 路由页面组件
│   ├── hooks/            # 自定义hooks (useChat, useWebSocket)
│   └── services/         # API调用封装 (axios)
└── Makefile              # 开发命令入口
```

## WHERE TO LOOK
| 任务 | 位置 | 说明 |
|------|------|------|
| 添加新API路由 | `backend/app/api/routes/` | 按功能分文件，路由注册在`main.py` |
| 修改LLM调用逻辑 | `backend/app/services/llm_service.py` | DashScope OpenAI兼容接口 |
| 修改面试流程提示词 | `backend/app/config/prompts/question_prompt.md` | 面试问题生成模板 |
| 修改报告生成逻辑 | `backend/app/services/report_service.py` | 多步骤LLM调用链 |
| 添加新页面 | `frontend/src/pages/` | 在`router.tsx`注册路由 |
| WebSocket消息处理 | `backend/app/api/routes/websocket.py` | 聊天同步和控制命令 |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Interview` | ORM Model | `backend/app/database/models.py` | 面试会话主实体 |
| `ChatMessage` | ORM Model | `backend/app/database/models.py` | 聊天消息存储 |
| `InterviewReport` | ORM Model | `backend/app/database/models.py` | 分析报告实体 |
| `LLMService` | Service | `backend/app/services/llm_service.py` | DashScope API调用封装 |
| `ReportService` | Service | `backend/app/services/report_service.py` | 报告生成流水线 |
| `WebSocketManager` | Service | `backend/app/services/websocket_manager.py` | WebSocket连接管理 |
| `PromptService` | Service | `backend/app/services/prompt_service.py` | 提示词模板渲染 |
| `Settings` | Config | `backend/app/config/settings.py` | 应用配置（环境变量） |
| `useChat` | Hook | `frontend/src/hooks/useChat.ts` | SSE流式聊天 |
| `useWebSocket` | Hook | `frontend/src/hooks/useWebSocket.ts` | WebSocket实时同步 |

## CONVENTIONS
- **Python**: 异步优先 (`async def`)，Pydantic v2数据验证，SQLAlchemy 2.0 ORM
- **TypeScript**: React 18函数组件，React Router 6，严格模式 (`strict: true`)
- **API风格**: RESTful + WebSocket混合，无API版本号 (`/api/interview`而非`/api/v1/`)
- **LLM集成**: 使用OpenAI兼容接口调用DashScope，模型默认`qwen-plus`
- **实时通信**: SSE用于AI流式响应，WebSocket用于双端聊天同步

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT** 在`Settings`类中使用`BaseSettings` - 当前手动实现`__init__`读取环境变量
- **DO NOT** 在前端使用全局状态管理库 - 状态保持在组件/hooks级别
- **DO NOT** 添加ESLint/Prettier配置 - 项目未配置前端lint工具
- **DO NOT** 修改`pyproject.toml`中的`testpaths` - 当前配置指向`["tests"]`但实际目录在`app/tests/`（配置不匹配）

## UNIQUE STYLES
- **提示词模板**: Markdown文件存储 (`backend/app/config/prompts/*.md`)，通过字符串替换渲染
- **报告生成**: 6步LLM调用链（聊天总结→能力评估→匹配分析→优缺点→录用建议→追问）
- **双视图面试**: 面试官端 (`InterviewerPage`) 和候选人端 (`CandidatePage`) 通过WebSocket同步

## COMMANDS
```bash
# 开发环境启动
make install              # 安装依赖
make dev                  # 同时启动前后端 (后台运行)
make backend              # 仅启动后端 (uvicorn --reload)
make frontend             # 仅启动前端 (vite)

# 后端单独命令
cd backend && uvicorn app.main:app --reload --port 8000

# 前端单独命令
cd frontend && npm run dev

# 测试 (注意: 无实际测试文件)
make test                 # pytest + npm test (会失败)

# 清理
make clean                # 删除数据库和构建产物
```

## NOTES
- **API密钥**: 需设置`DASHSCOPE_API_KEY`环境变量，否则LLM调用失败
- **数据库**: SQLite存储在`backend/data/interviewpilot.db`，首次启动自动创建
- **测试缺口**: 无实际测试文件，pytest和npm test配置存在但无内容
- **端口**: 后端8000，前端5173，Vite已配置代理
- **面试流程**: AI自动提问 → 候选人回答 → WebSocket同步 → SSE流式生成下一问题 → 结束后生成报告