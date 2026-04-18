# API Routes

**Generated:** 2026-04-18

## OVERVIEW
FastAPI路由层：REST CRUD、SSE流式响应、WebSocket实时同步。

## WHERE TO LOOK
| 文件 | 路由 | 功能 |
|------|------|------|
| `interview.py` | `/create`, `/history`, `/{id}`, `/{id}/detail` | 面试会话CRUD、URL生成、历史列表、详情查询 |
| `chat.py` | `/api/chat/stream/{id}` | SSE流式AI问题生成，LLMService调用，消息持久化 |
| `websocket.py` | `/ws/interview/{id}` | WebSocket双端聊天同步、控制命令（toggle_ai_managed, end_interview） |
| `control.py` | `/api/control/start/{id}`, `/toggle/{id}`, `/end/{id}` | 面试状态控制：启动、切换AI模式、结束 |
| `report.py` | `/api/report/generate/{id}`, `/api/report/{id}` | 报告生成（调用ReportService）、报告查询 |

## CONVENTIONS
- **数据库注入**: 所有路由使用 `db: Session = Depends(get_db)`
- **响应模型**: REST路由使用 `response_model=PydanticModel` 强类型
- **错误处理**: 使用 `HTTPException(status_code=404/400/500, detail=...)`
- **路径参数**: 面试ID统一使用 `{interview_id}` 格式
- **SSE模式**: `EventSourceResponse(generate())` + `ServerSentEvent(data=..., event="token/done/end/error")`
- **WebSocket消息**: JSON格式，`type`字段区分 `chat_message` / `control`
- **广播机制**: WebSocket通过 `ws_manager.broadcast(interview_id, {...})` 同步双端

## ANTI-PATTERNS
- **DO NOT** 在chat.py返回 `{"error": ...}` dict - 应使用HTTPException保持一致性
- **DO NOT** 混用URL前缀 - interview.py无 `/api/` 前缀，其他路由有（需统一）
- **DO NOT** 在WebSocket内直接操作LLM - SSE负责AI生成，WebSocket仅同步消息