# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-20
**Commit:** 059776a
**Branch:** main

## OVERVIEW
企业AI面试智能体 - FastAPI后端 + React前端，使用阿里云DashScope (Qwen) LLM进行面试问答生成和人才画像分析。支持岗位模板管理、简历解析、实时语音识别、AI配置优化等功能。

## STRUCTURE
```
interviewpilot/
├── backend/app/              # FastAPI应用核心
│   ├── api/routes/           # REST + WebSocket路由
│   │   ├── interview.py      # 面试创建/配置
│   │   ├── job_position.py   # 岗位模板CRUD
│   │   ├── optimize.py       # AI内容优化
│   │   ├── resume.py         # 简历解析
│   │   ├── speech.py         # 实时语音WebSocket
│   │   ├── chat.py           # SSE流式聊天
│   │   ├── report.py         # 报告生成
│   │   ├── control.py        # 面试控制命令
│   │   └── websocket.py      # 双端同步WebSocket
│   ├── services/             # 业务逻辑层
│   │   ├── llm_service.py    # DashScope API调用
│   │   ├── prompt_service.py # 提示词模板渲染
│   │   ├── report_service.py # 6步报告生成流水线
│   │   ├── resume_parser.py  # PDF/DOCX文本提取
│   │   ├── speech_service.py # Paraformer语音识别代理
│   │   └── websocket_manager.py # WebSocket连接管理
│   ├── models/               # Pydantic请求/响应模型
│   │   ├── interview.py      # 面试相关模型
│   │   ├── job_position.py   # 岗位相关模型
│   │   ├── chat.py           # 聊天消息模型
│   │   └── report.py         # 报告模型
│   ├── database/             # SQLAlchemy ORM模型
│   │   └── models.py         # JobPosition, Interview, ChatMessage, InterviewReport
│   └── config/prompts/       # LLM提示词模板
│       ├── question_prompt.md    # 面试问题生成
│       ├── end_check_prompt.md   # 结束判断
│       ├── optimization/         # AI优化模板(4个)
│       └── report/               # 报告生成模板(6个)
├── frontend/src/             # React + Vite前端
│   ├── pages/                # 路由页面组件(9个)
│   │   ├── HomePage.tsx          # 首页入口
│   │   ├── JobPositionListPage.tsx   # 岗位库列表
│   │   ├── JobPositionCreatePage.tsx # 创建岗位(AI优化)
│   │   ├── JobPositionDetailPage.tsx # 岗位详情(编辑/删除)
│   │   ├── CandidatePage.tsx     # 候选人端面试
│   │   ├── InterviewerPage.tsx   # 面试官端监控
│   │   ├── HistoryPage.tsx       # 面试记录列表
│   │   ├── DetailPage.tsx        # 面试详情(配置/聊天/报告)
│   │   └── ConfigPage.tsx        # 流程更新提示页
│   ├── components/           # 共享组件
│   │   ├── Navbar.tsx            # 导航栏
│   │   └── ResumeUploadModal.tsx # 简历上传弹窗
│   ├── hooks/                # 自定义hooks
│   │   ├── useChat.ts            # SSE流式聊天
│   │   ├── useWebSocket.ts       # WebSocket同步
│   │   └── useSpeechRecognition.ts # 语音识别
│   ├── services/             # API调用封装(axios)
│   └── types/                # TypeScript类型定义
└──── Makefile                # 开发命令入口
```

## WHERE TO LOOK
| 任务 | 位置 | 说明 |
|------|------|------|
| 添加新API路由 | `backend/app/api/routes/` | 按功能分文件，路由注册在`main.py` |
| 修改LLM调用逻辑 | `backend/app/services/llm_service.py` | DashScope OpenAI兼容接口 |
| 修改面试流程提示词 | `backend/app/config/prompts/question_prompt.md` | 面试问题生成模板 |
| 修改报告生成逻辑 | `backend/app/services/report_service.py` | 6步LLM调用链 |
| 岗位模板管理 | `backend/app/api/routes/job_position.py` | CRUD路由，关联Interview |
| AI内容优化 | `backend/app/api/routes/optimize.py` | JD/公司/偏好/流程一键优化 |
| 简历解析功能 | `backend/app/services/resume_parser.py` | PDF/DOCX文本提取 |
| 语音识别功能 | `backend/app/services/speech_service.py` | Paraformer WebSocket代理 |
| 添加新页面 | `frontend/src/pages/` | 在`router.tsx`注册路由 |
| 添加新组件 | `frontend/src/components/` | 共享UI组件 |
| 添加新类型 | `frontend/src/types/interview.ts` | TypeScript接口定义 |
| WebSocket消息处理 | `backend/app/api/routes/websocket.py` | 聊天同步和控制命令 |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `JobPosition` | ORM Model | `backend/app/database/models.py` | 岗位模板实体(JD/公司/偏好/面试方案配置) |
| `Interview` | ORM Model | `backend/app/database/models.py` | 面试会话实体(关联JobPosition) |
| `ChatMessage` | ORM Model | `backend/app/database/models.py` | 聊天消息存储 |
| `InterviewReport` | ORM Model | `backend/app/database/models.py` | 分析报告实体(6个维度) |
| `LLMService` | Service | `backend/app/services/llm_service.py` | DashScope API调用封装 |
| `ReportService` | Service | `backend/app/services/report_service.py` | 报告生成6步流水线 |
| `ResumeParserService` | Service | `backend/app/services/resume_parser.py` | PDF/DOCX文本提取 |
| `SpeechService` | Service | `backend/app/services/speech_service.py` | Paraformer实时转录代理 |
| `WebSocketManager` | Service | `backend/app/services/websocket_manager.py` | WebSocket连接管理 |
| `PromptService` | Service | `backend/app/services/prompt_service.py` | 提示词模板渲染 |
| `Settings` | Config | `backend/app/config/settings.py` | 应用配置(环境变量) |
| `JobPositionCreateRequest` | Pydantic | `backend/app/models/job_position.py` | 创建岗位请求模型 |
| `OptimizeRequest` | Pydantic | `backend/app/models/job_position.py` | AI优化请求模型 |
| `useChat` | Hook | `frontend/src/hooks/useChat.ts` | SSE流式聊天(token/done/end事件) |
| `useWebSocket` | Hook | `frontend/src/hooks/useWebSocket.ts` | WebSocket实时同步(chat_sync/control_update) |
| `useSpeechRecognition` | Hook | `frontend/src/hooks/useSpeechRecognition.ts` | 实时语音转文字 |

## CONVENTIONS
- **Python**: 异步优先 (`async def`)，Pydantic v2数据验证，SQLAlchemy 2.0 ORM
- **TypeScript**: React 18函数组件，React Router 6，严格模式 (`strict: true`)
- **API风格**: RESTful + WebSocket混合，无API版本号 (`/api/interview`而非`/api/v1/`)
- **LLM集成**: 使用OpenAI兼容接口调用DashScope，模型默认`qwen-plus`
- **实时通信**: SSE用于AI流式响应，WebSocket用于双端聊天同步和语音识别
- **岗位模板化**: 面试配置存储在JobPosition模板，Interview通过外键引用

## ANTI-PATTERNS (THIS PROJECT)
- **DO NOT** 在`Settings`类中使用`BaseSettings` - 当前手动实现`__init__`读取环境变量
- **DO NOT** 在前端使用全局状态管理库 - 状态保持在组件/hooks级别
- **DO NOT** 添加ESLint/Prettier配置 - 项目未配置前端lint工具
- **DO NOT** 修改`pyproject.toml`中的`testpaths` - 当前配置指向`["tests"]`但实际目录在`app/tests/`（配置不匹配）
- **DO NOT** 在Interview模型直接存储JD/公司/偏好 - 使用`job_position_id`外键引用JobPosition

## UNIQUE STYLES
- **岗位模板化流程**: 先创建岗位模板 → 从岗位开始面试 → 上传简历 → AI面试 → 生成报告
- **AI配置优化**: 一键优化JD/公司信息/面试偏好/面试方案，基于LLM改进内容
- **提示词模板**: Markdown文件存储 (`backend/app/config/prompts/*.md`)，通过字符串替换渲染
- **报告生成**: 6步LLM调用链（聊天总结→能力评估→匹配分析→优缺点→录用建议→追问）
- **双视图面试**: 面试官端 (`InterviewerPage`) 和候选人端 (`CandidatePage`) 通过WebSocket同步
- **实时语音**: WebSocket代理Paraformer，候选人端支持语音回答，实时转写显示
- **简历解析**: 支持拖拽上传PDF/DOCX或手动输入，提取文本用于面试上下文

## COMMANDS
```bash
# 开发环境启动
make install              # 安装依赖
make dev                  # 同时启动前后端 (后台运行)
make backend              # 仅启动后端 (uvicorn --reload --host 0.0.0.0 --port 8000)
make frontend             # 仅启动前端 (vite)

# 后端单独命令
cd backend && uvicorn app.main:app --reload --port 8000

# 前端单独命令
cd frontend && npm run dev

# 测试 (注意: 无实际测试文件)
make test                 # pytest + npm test (会失败)

# 清理
make clean                # 删除数据库和构建产物

# 停止服务
make stop                 # 杀掉8000和5173端口进程
```

## NOTES
- **API密钥**: 需设置`DASHSCOPE_API_KEY`环境变量，否则LLM调用失败；语音识别需要`PARAFORMER_API_KEY`
- **数据库**: SQLite存储在`backend/data/interviewpilot.db`，首次启动自动创建
- **测试缺口**: 无实际测试文件，pytest和npm test配置存在但无内容
- **端口**: 后端8000，前端5173，Vite已配置代理
- **面试流程**: 创建岗位 → 开始面试(上传简历) → AI自动提问 → 候选人回答(文字/语音) → WebSocket同步 → SSE流式生成下一问题 → 结束后生成报告
- **岗位命名**: JobPosition.name格式建议为"岗位名称-团队"，如"高级后端工程师-平台组"
- **面试控制**: 面试官端可切换AI托管/手动模式，手动模式可输入问题，AI托管模式自动生成问题