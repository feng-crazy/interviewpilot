# WebSocket双端同步优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复面试官/候选人页面WebSocket同步问题，实现Phase 1核心修复+Phase 2体验优化

**Architecture:** 
- Phase 1: 扩展detail API返回历史消息，sequence原子计算，WebSocket广播失败日志
- Phase 2: SSE流式推送WebSocket(streaming_sync)，useWebSocket重连去重，InterviewerPage流式显示

**Tech Stack:** FastAPI, SQLAlchemy, React, TypeScript, WebSocket, SSE

---

## File Structure

| 文件 | 改动类型 | 责责 |
|------|----------|------|
| `backend/app/api/routes/interview.py` | Modify | `/detail` API扩展，返回messages |
| `backend/app/api/routes/websocket.py` | Modify | sequence原子计算 |
| `backend/app/api/routes/chat.py` | Modify | streaming_sync/streaming_end广播 |
| `backend/app/services/websocket_manager.py` | Modify | broadcast失败日志+清理 |
| `frontend/src/types/interview.ts` | Modify | WebSocket消息类型定义 |
| `frontend/src/hooks/useWebSocket.ts` | Rewrite | 重连机制+去重逻辑+状态提示 |
| `frontend/src/hooks/useChat.ts` | Modify | SSE重连机制 |
| `frontend/src/pages/CandidatePage.tsx` | Modify | 历史加载+移除重复添加+状态提示 |
| `frontend/src/pages/InterviewerPage.tsx` | Modify | 历史加载+流式显示+状态提示 |
| `frontend/src/index.css` | Modify | 状态提示banner样式 |

---

## Phase 1: Core Fixes

### Task 1: 扩展interview detail API返回历史消息

**Files:**
- Modify: `backend/app/api/routes/interview.py`

- [ ] **Step 1: Read current interview.py implementation**

Read file to locate `get_interview_detail` function.

- [ ] **Step 2: Add messages query and return field**

```python
# backend/app/api/routes/interview.py
# 在 get_interview_detail 函数中添加:

@router.get("/api/interview/{interview_id}/detail")
async def get_interview_detail(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # 新增: 加载历史消息
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.interview_id == interview_id)
        .order_by(ChatMessage.sequence)
        .all()
    )
    
    return {
        # 现有字段保持不变
        "id": interview.id,
        "job_position_id": interview.job_position_id,
        "candidate_url": interview.candidate_url,
        "jd_text": interview.job_position.jd_text,
        "resume_text": interview.resume_text,
        "ai_managed": interview.ai_managed,
        "status": interview.status,
        "started_at": interview.started_at.isoformat() if interview.started_at else None,
        "ended_at": interview.ended_at.isoformat() if interview.ended_at else None,
        "max_questions": interview.max_questions,
        "max_duration": interview.max_duration,
        
        # 新增字段
        "messages": [
            {
                "id": msg.id,
                "sequence": msg.sequence,
                "role": msg.role,
                "content": msg.content,
                "source": msg.source,
                "input_type": msg.input_type,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ]
    }
```

- [ ] **Step 3: Run backend to verify API works**

Run: `cd backend && uvicorn app.main:app --reload --port 8000`
Expected: Backend starts without errors

- [ ] **Step 4: Test API with curl**

Run: `curl http://localhost:8000/api/interview/{existing_id}/detail | jq '.messages'`
Expected: Returns array of messages with all fields

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/routes/interview.py
git commit -m "feat(api): interview detail returns historical messages"
```

---

### Task 2: websocket.py sequence原子计算

**Files:**
- Modify: `backend/app/api/routes/websocket.py`

- [ ] **Step 1: Read current websocket.py**

Locate the sequence calculation block (around line 43-49).

- [ ] **Step 2: Import func and modify sequence calculation**

```python
# backend/app/api/routes/websocket.py
# 在文件顶部添加import:
from sqlalchemy import func

# 修改 sequence 计算逻辑 (line 43-49):
# 原代码:
# last_message = (
#     db.query(ChatMessage)
#     .filter(ChatMessage.interview_id == interview_id)
#     .order_by(ChatMessage.sequence.desc())
#     .first()
# )
# sequence = (last_message.sequence + 1) if last_message else 1

# 改为:
sequence = db.query(func.max(ChatMessage.sequence)).filter(
    ChatMessage.interview_id == interview_id
).scalar() or 0
sequence += 1
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd backend && python -c "from app.api.routes.websocket import router; print('OK')"`
Expected: Prints "OK" without import errors

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/routes/websocket.py
git commit -m "fix(websocket): atomic sequence calculation using db func.max"
```

---

### Task 3: chat.py sequence原子计算

**Files:**
- Modify: `backend/app/api/routes/chat.py`

- [ ] **Step 1: Read current chat.py**

Locate the sequence calculation block (around line 93-99) in the `generate()` async function.

- [ ] **Step 2: Import func and modify sequence calculation**

```python
# backend/app/api/routes/chat.py
# 在文件顶部添加import:
from sqlalchemy import func

# 修改 generate() 函数中的 sequence 计算逻辑 (line 93-99):
# 原代码:
# last_message = (
#     db.query(ChatMessage)
#     .filter(ChatMessage.interview_id == interview_id)
#     .order_by(ChatMessage.sequence.desc())
#     .first()
# )
# sequence = (last_message.sequence + 1) if last_message else 1

# 改为:
sequence = db.query(func.max(ChatMessage.sequence)).filter(
    ChatMessage.interview_id == interview_id
).scalar() or 0
sequence += 1
```

- [ ] **Step 3: Verify no syntax errors**

Run: `cd backend && python -c "from app.api.routes.chat import router; print('OK')"`
Expected: Prints "OK" without import errors

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/routes/chat.py
git commit -m "fix(chat): atomic sequence calculation using db func.max"
```

---

### Task 4: websocket_manager broadcast失败日志

**Files:**
- Modify: `backend/app/services/websocket_manager.py`

- [ ] **Step 1: Read current websocket_manager.py**

Review the `broadcast` method (line 53-59).

- [ ] **Step 2: Add error logging and connection cleanup**

```python
# backend/app/services/websocket_manager.py
# 修改 broadcast 方法 (line 53-59):

async def broadcast(self, interview_id: str, message: dict):
    if interview_id in self.active_connections:
        failed_connections = []
        for connection in self.active_connections[interview_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                self.logger.warning(
                    "websocket_broadcast_failed",
                    interview_id=interview_id,
                    error_type=type(e).__name__,
                    error_message=str(e),
                )
                failed_connections.append(connection)
        
        # 清理失败连接
        for conn in failed_connections:
            if interview_id in self.active_connections:
                self.active_connections[interview_id].discard(conn)
```

- [ ] **Step 3: Verify import**

Run: `cd backend && python -c "from app.services.websocket_manager import ws_manager; print('OK')"`
Expected: Prints "OK"

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/websocket_manager.py
git commit -m "fix(websocket): log broadcast failures and cleanup dead connections"
```

---

### Task 5: WebSocket消息类型定义

**Files:**
- Modify: `frontend/src/types/interview.ts`

- [ ] **Step 1: Read current interview.ts**

Review existing type definitions.

- [ ] **Step 2: Add WebSocketMessage interface**

```typescript
// frontend/src/types/interview.ts
// 添加新的接口定义:

export interface WebSocketMessage {
  type: 'chat_sync' | 'streaming_sync' | 'streaming_end' | 'control_update' | 'interview_ended' | 'error';
  
  // chat_sync - 完整消息同步 (候选人/面试官消息)
  message?: ChatMessage;
  
  // streaming_sync - AI流式token (新增)
  message_id?: string;
  content?: string;
  is_start?: boolean;
  
  // streaming_end - 流式结束 (新增)
  final_message?: ChatMessage;
  
  // control_update - 控制状态更新
  ai_managed?: boolean;
  
  // error - 错误消息
  error_message?: string;
}

// 确保 ChatMessage 包含所有必要字段:
export interface ChatMessage {
  id: string;
  sequence: number;
  role: 'ai' | 'interviewer' | 'candidate';
  content: string;
  source: string;
  input_type?: string;
  created_at: string;
}

// 新增: InterviewConfig扩展，包含messages
export interface InterviewConfig {
  id: string;
  job_position_id: string;
  candidate_url: string;
  jd_text: string;
  resume_text: string | null;
  ai_managed: boolean;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  max_questions: number;
  max_duration: number;
  messages: ChatMessage[];  // 新增
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npm run build -- --mode development 2>&1 | head -20`
Expected: No type errors related to interview.ts

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/interview.ts
git commit -m "feat(types): add WebSocketMessage and extend InterviewConfig with messages"
```

---

## Phase 2: Experience Optimization

### Task 6: chat.py SSE流式推送WebSocket

**Files:**
- Modify: `backend/app/api/routes/chat.py`

- [ ] **Step 1: Read current chat.py generate function**

Review the full `generate()` async generator function.

- [ ] **Step 2: Add streaming_sync and streaming_end broadcast**

```python
# backend/app/api/routes/chat.py
# 需要添加的imports (如果不存在):
import time
import uuid

# 修改 generate() 函数:
async def generate():
    full_response = ""
    message_id = str(uuid.uuid4())  # 预生成消息ID
    last_broadcast_time = time.time()
    accumulated_tokens = ""
    
    # 发送开始标志
    await ws_manager.broadcast(interview_id, {
        "type": "streaming_sync",
        "message_id": message_id,
        "content": "",
        "is_start": True,
    })
    
    try:
        async for token in llm_service.generate_stream(prompt):
            full_response += token
            accumulated_tokens += token
            yield ServerSentEvent(
                data=json.dumps({"content": token}), event="token"
            )
            
            # 每100ms批量推送
            current_time = time.time()
            if current_time - last_broadcast_time >= 0.1:
                await ws_manager.broadcast(interview_id, {
                    "type": "streaming_sync",
                    "message_id": message_id,
                    "content": accumulated_tokens,
                })
                last_broadcast_time = current_time

        if "END:" in full_response:
            interview.status = "ended"
            interview.ended_at = datetime.utcnow()
            db.commit()

            yield ServerSentEvent(data=json.dumps({"type": "end"}), event="end")

            await ws_manager.broadcast(
                interview_id,
                {
                    "type": "interview_ended",
                },
            )
        elif "QUESTION:" in full_response:
            question_content = full_response.replace("QUESTION:", "").strip()

            # sequence原子计算 (已在Task 3完成)
            sequence = db.query(func.max(ChatMessage.sequence)).filter(
                ChatMessage.interview_id == interview_id
            ).scalar() or 0
            sequence += 1

            ai_message = ChatMessage(
                id=message_id,  # 使用预生成的ID
                interview_id=interview_id,
                sequence=sequence,
                role="ai",
                content=question_content,
                source="ai_generated",
            )

            db.add(ai_message)
            db.commit()
            db.refresh(ai_message)

            yield ServerSentEvent(
                data=json.dumps(
                    {
                        "message_id": ai_message.id,
                        "role": "ai",
                        "content": question_content,
                    }
                ),
                event="done",
            )

            # 新增: streaming_end替代chat_sync
            await ws_manager.broadcast(
                interview_id,
                {
                    "type": "streaming_end",
                    "final_message": {
                        "id": ai_message.id,
                        "sequence": ai_message.sequence,
                        "role": "ai",
                        "content": question_content,
                        "source": "ai_generated",
                        "created_at": ai_message.created_at.isoformat(),
                    },
                },
            )
    except Exception as e:
        yield ServerSentEvent(data=json.dumps({"error": str(e)}), event="error")
```

- [ ] **Step 3: Verify imports are complete**

Check that `time`, `uuid`, `func`, `ws_manager` are imported at the top of the file.

- [ ] **Step 4: Test backend starts**

Run: `cd backend && uvicorn app.main:app --reload --port 8000`
Expected: No errors, backend starts successfully

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/routes/chat.py
git commit -m "feat(chat): SSE streaming broadcasts streaming_sync and streaming_end via WebSocket"
```

---

### Task 7: 重构useWebSocket.ts (重连+去重+状态)

**Files:**
- Rewrite: `frontend/src/hooks/useWebSocket.ts`

- [ ] **Step 1: Read current useWebSocket.ts**

Review existing implementation (51 lines).

- [ ] **Step 2: Rewrite with full reconnect and dedup logic**

```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage, ChatMessage } from '../types/interview';

interface ReconnectState {
  attemptCount: number;
  maxAttempts: number;
  baseDelay: number;
}

export function useWebSocket(interviewId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const receivedMessageIdsRef = useRef<Set<string>>(new Set());
  const reconnectStateRef = useRef<ReconnectState>({
    attemptCount: 0,
    maxAttempts: 5,
    baseDelay: 2000,
  });

  const createConnection = useCallback(() => {
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/interview/${interviewId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setIsReconnecting(false);
      setShowReconnectPrompt(false);
      reconnectStateRef.current.attemptCount = 0;
    };

    ws.onclose = () => {
      setConnected(false);

      if (reconnectStateRef.current.attemptCount < reconnectStateRef.current.maxAttempts) {
        setIsReconnecting(true);
        reconnectStateRef.current.attemptCount++;

        const delay = reconnectStateRef.current.attemptCount === 1 ? 0 : reconnectStateRef.current.baseDelay;
        setTimeout(() => {
          if (reconnectStateRef.current.attemptCount <= reconnectStateRef.current.maxAttempts) {
            createConnection();
          }
        }, delay);
      } else {
        setIsReconnecting(false);
        setShowReconnectPrompt(true);
      }
    };

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);

      // 去重逻辑 - 检查消息ID是否已接收
      if (data.type === 'chat_sync' && data.message?.id) {
        if (receivedMessageIdsRef.current.has(data.message.id)) {
          return; // 跳过重复消息
        }
        receivedMessageIdsRef.current.add(data.message.id);
      }

      if (data.type === 'streaming_end' && data.final_message?.id) {
        if (receivedMessageIdsRef.current.has(data.final_message.id)) {
          return;
        }
        receivedMessageIdsRef.current.add(data.final_message.id);
      }

      setLastMessage(data);
    };

    ws.onerror = () => {
      // 不触发重连，等onclose处理
    };
  }, [interviewId]);

  useEffect(() => {
    createConnection();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [createConnection]);

  // 初始化历史消息ID (用于去重)
  const initializeMessageIds = useCallback((messages: ChatMessage[]) => {
    const ids = new Set(messages.map(m => m.id));
    receivedMessageIdsRef.current = ids;
  }, []);

  const sendMessage = useCallback((role: string, content: string, input_type: string = 'text') => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        role,
        content,
        input_type,
      }));
    }
  }, [connected]);

  const sendControl = useCallback((action: string, data: Record<string, unknown> = {}) => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'control',
        action,
        ...data,
      }));
    }
  }, [connected]);

  // 手动重连 (用于用户点击刷新后)
  const manualReconnect = useCallback(() => {
    reconnectStateRef.current.attemptCount = 0;
    setShowReconnectPrompt(false);
    createConnection();
  }, [createConnection]);

  return {
    connected,
    lastMessage,
    sendMessage,
    sendControl,
    isReconnecting,
    showReconnectPrompt,
    reconnectAttempt: reconnectStateRef.current.attemptCount,
    maxReconnectAttempts: reconnectStateRef.current.maxAttempts,
    initializeMessageIds,
    manualReconnect,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npm run build -- --mode development 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useWebSocket.ts
git commit -m "feat(hook): useWebSocket with reconnect, dedup, and status states"
```

---

### Task 8: useChat.ts SSE重连机制

**Files:**
- Modify: `frontend/src/hooks/useChat.ts`

- [ ] **Step 1: Read current useChat.ts**

Review existing implementation (71 lines).

- [ ] **Step 2: Add SSE reconnect mechanism**

```typescript
// frontend/src/hooks/useChat.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types/interview';

interface SSEReconnectState {
  attemptCount: number;
  maxAttempts: number;
  baseDelay: number;
}

export function useChat(interviewId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const reconnectStateRef = useRef<SSEReconnectState>({
    attemptCount: 0,
    maxAttempts: 3,
    baseDelay: 2000,
  });

  const createEventSource = useCallback(() => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/stream/${interviewId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    setStreamingContent('');
    setIsStreaming(true);
    setSseError(null);

    eventSource.addEventListener('token', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.content) {
        setStreamingContent((prev) => prev + data.content);
      }
    });

    eventSource.addEventListener('done', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.message_id) {
        setMessages((prev) => [...prev, {
          id: data.message_id,
          role: data.role,
          content: data.content,
          sequence: prev.length + 1,
          source: 'ai_generated',
          created_at: new Date().toISOString(),
        }]);
        setIsStreaming(false);
        setStreamingContent('');
        reconnectStateRef.current.attemptCount = 0;
        eventSource.close();
      }
    });

    eventSource.addEventListener('end', () => {
      setIsStreaming(false);
      setStreamingContent('');
      eventSource.close();
    });

    eventSource.onerror = () => {
      eventSource.close();

      if (reconnectStateRef.current.attemptCount < reconnectStateRef.current.maxAttempts) {
        reconnectStateRef.current.attemptCount++;
        const delay = reconnectStateRef.current.attemptCount === 1 ? 0 : reconnectStateRef.current.baseDelay;
        setTimeout(() => {
          createEventSource();
        }, delay);
      } else {
        setIsStreaming(false);
        setSseError('AI连接中断，请稍后重试');
      }
    };
  }, [interviewId]);

  const startStream = useCallback(() => {
    reconnectStateRef.current.attemptCount = 0;
    createEventSource();
  }, [createEventSource]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearError = useCallback(() => {
    setSseError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return { 
    messages, 
    streamingContent, 
    isStreaming, 
    sseError,
    startStream, 
    addMessage,
    clearError,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npm run build -- --mode development 2>&1 | head -20`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useChat.ts
git commit -m "feat(hook): useChat SSE reconnect mechanism with error state"
```

---

### Task 9: CandidatePage.tsx改动

**Files:**
- Modify: `frontend/src/pages/CandidatePage.tsx`

- [ ] **Step 1: Read current CandidatePage.tsx**

Review existing implementation (169 lines), locate key sections.

- [ ] **Step 2: Update imports and add historicalMessagesLoaded state**

```typescript
// frontend/src/pages/CandidatePage.tsx
// 确保imports包含:
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getInterviewConfig } from '../services/api';
import type { InterviewConfig, ChatMessage } from '../types/interview';

// 在组件顶部添加状态:
const [historicalMessagesLoaded, setHistoricalMessagesLoaded] = useState(false);
```

- [ ] **Step 3: Update useWebSocket hook usage**

```typescript
// 替换现有的 useWebSocket 调用:
const { 
  connected, 
  lastMessage, 
  sendMessage, 
  isReconnecting, 
  showReconnectPrompt,
  reconnectAttempt,
  maxReconnectAttempts,
  initializeMessageIds,
} = useWebSocket(id || '');
```

- [ ] **Step 4: Update useChat hook usage**

```typescript
// 替换现有的 useChat 调用:
const { 
  messages, 
  streamingContent, 
  isStreaming, 
  sseError,
  startStream, 
  addMessage,
  clearError,
} = useChat(id || '');
```

- [ ] **Step 5: Update useEffect for historical messages**

```typescript
// 替换现有的 useEffect (line 21-25):
useEffect(() => {
  if (id) {
    getInterviewConfig(id).then((data: InterviewConfig) => {
      setConfig(data);
      // 新增: 加载历史消息
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach((msg: ChatMessage) => addMessage(msg));
        initializeMessageIds(data.messages);
      }
      setHistoricalMessagesLoaded(true);
    });
  }
}, [id, addMessage, initializeMessageIds]);
```

- [ ] **Step 6: Update WebSocket message handling**

```typescript
// 替换现有的 useEffect (line 27-34):
useEffect(() => {
  if (lastMessage?.type === 'chat_sync') {
    // 去重已在useWebSocket中处理，直接添加
    if (lastMessage.message) {
      addMessage(lastMessage.message);
    }
  }
  if (lastMessage?.type === 'streaming_end') {
    if (lastMessage.final_message) {
      addMessage(lastMessage.final_message);
    }
  }
  if (lastMessage?.type === 'interview_ended') {
    setInterviewEnded(true);
  }
}, [lastMessage, addMessage]);
```

- [ ] **Step 7: Update handleSend to remove local addMessage**

```typescript
// 替换现有的 handleSend (line 47-61):
const handleSend = () => {
  const textToSend = inputText.trim() || getFullTranscript().trim();
  if (textToSend) {
    sendMessage('candidate', textToSend, voiceMode ? 'voice' : 'text');
    // 移除: addMessage({...}) - 依赖WebSocket chat_sync同步
    setInputText('');
    stopRecording();
    setVoiceMode(false);
    clearError(); // 清除SSE错误
    if (historicalMessagesLoaded) {
      setTimeout(() => startStream(), 500);
    }
  }
};
```

- [ ] **Step 8: Add status banners to JSX**

```typescript
// 在 chat-header div 之后添加状态提示:
<div className="chat-header">
  ...
</div>

{/* 新增: 连接状态提示 */}
{isReconnecting && (
  <div className="status-banner reconnecting" role="status" aria-live="polite">
    正在重新连接... ({reconnectAttempt}/{maxReconnectAttempts})
  </div>
)}
{showReconnectPrompt && (
  <div className="status-banner disconnected" role="alert" aria-live="assertive">
    连接中断，请刷新页面
  </div>
)}
{sseError && (
  <div className="status-banner error" role="alert" aria-live="assertive">
    {sseError}
  </div>
)}
```

- [ ] **Step 9: Verify TypeScript compiles**

Run: `cd frontend && npm run build -- --mode development 2>&1 | head -30`
Expected: No type errors

- [ ] **Step 10: Commit**

```bash
git add frontend/src/pages/CandidatePage.tsx
git commit -m "feat(page): CandidatePage loads historical messages, removes duplicate add, adds status banners"
```

---

### Task 10: InterviewerPage.tsx改动

**Files:**
- Modify: `frontend/src/pages/InterviewerPage.tsx`

- [ ] **Step 1: Read current InterviewerPage.tsx**

Review existing implementation (231 lines).

- [ ] **Step 2: Add streaming state and historicalMessagesLoaded**

```typescript
// frontend/src/pages/InterviewerPage.tsx
// 在组件顶部添加新状态:
const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
const [streamingContent, setStreamingContent] = useState('');
const [historicalMessagesLoaded, setHistoricalMessagesLoaded] = useState(false);
```

- [ ] **Step 3: Update useWebSocket hook usage**

```typescript
// 替换现有的 useWebSocket 调用:
const { 
  connected, 
  lastMessage, 
  sendMessage, 
  sendControl,
  isReconnecting,
  showReconnectPrompt,
  reconnectAttempt,
  maxReconnectAttempts,
  initializeMessageIds,
} = useWebSocket(id || '');
```

- [ ] **Step 4: Update useEffect for historical messages**

```typescript
// 替换现有的 useEffect (line 21-28):
useEffect(() => {
  if (id) {
    getInterviewConfig(id).then((data: InterviewConfig) => {
      setConfig(data);
      setAiManaged(data.ai_managed);
      // 新增: 加载历史消息
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        initializeMessageIds(data.messages);
      }
      setHistoricalMessagesLoaded(true);
    });
  }
}, [id, initializeMessageIds]);
```

- [ ] **Step 5: Update WebSocket message handling**

```typescript
// 替换现有的 useEffect (line 30-40):
useEffect(() => {
  if (lastMessage?.type === 'chat_sync') {
    if (lastMessage.message) {
      setMessages((prev) => [...prev, lastMessage.message!]);
    }
  }
  if (lastMessage?.type === 'streaming_sync') {
    if (lastMessage.is_start) {
      setStreamingMessageId(lastMessage.message_id);
      setStreamingContent('');
    } else if (lastMessage.message_id === streamingMessageId && lastMessage.content) {
      setStreamingContent(lastMessage.content);
    }
  }
  if (lastMessage?.type === 'streaming_end') {
    if (lastMessage.final_message) {
      setMessages((prev) => [...prev, lastMessage.final_message!]);
    }
    setStreamingMessageId(null);
    setStreamingContent('');
  }
  if (lastMessage?.type === 'control_update' && lastMessage.ai_managed !== undefined) {
    setAiManaged(lastMessage.ai_managed);
  }
  if (lastMessage?.type === 'interview_ended') {
    setInterviewEnded(true);
  }
}, [lastMessage, streamingMessageId]);
```

- [ ] **Step 6: Add streaming message rendering in JSX**

```typescript
// 在 chat-messages div 中添加流式消息渲染:
<div className="chat-messages">
  {messages.length === 0 && !streamingMessageId ? (
    <div className="empty-state">
      <div className="empty-state-icon">💬</div>
      <div className="empty-state-title">等待候选人加入</div>
      <div className="empty-state-description">分享链接给候选人开始面试</div>
    </div>
  ) : (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <div className="message-role">
            {msg.role === 'ai' ? 'AI面试官' : 
             msg.role === 'interviewer' ? '面试官' : '面试者'}
          </div>
          <div className="message-content">{msg.content}</div>
        </div>
      ))}
      
      {/* 新增: 流式消息显示 */}
      {streamingMessageId && (
        <div className="message ai streaming">
          <div className="message-role">AI面试官</div>
          <div className="message-content">
            {streamingContent}<span className="streaming-cursor" />
          </div>
        </div>
      )}
    </>
  )}
</div>
```

- [ ] **Step 7: Add status banners**

```typescript
// 在 chat-header div 之后添加:
{isReconnecting && (
  <div className="status-banner reconnecting" role="status" aria-live="polite">
    正在重新连接... ({reconnectAttempt}/{maxReconnectAttempts})
  </div>
)}
{showReconnectPrompt && (
  <div className="status-banner disconnected" role="alert" aria-live="assertive">
    连接中断，请刷新页面
  </div>
)}
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `cd frontend && npm run build -- --mode development 2>&1 | head -30`
Expected: No type errors

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/InterviewerPage.tsx
git commit -m "feat(page): InterviewerPage loads historical messages, shows streaming AI content, adds status banners"
```

---

### Task 11: 状态提示CSS样式

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Read current index.css**

Locate existing style sections.

- [ ] **Step 2: Add status banner and streaming cursor styles**

```css
/* frontend/src/index.css */
/* 在文件末尾添加: */

/* 状态提示Banner */
.status-banner {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: center;
  font-size: 0.875rem;
  border-radius: var(--border-radius-sm);
  margin: var(--spacing-sm) var(--spacing-md);
}

.status-banner.reconnecting {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
  border: 1px solid var(--color-warning-200);
}

.status-banner.disconnected {
  background: var(--color-error-50);
  color: var(--color-error-700);
  border: 1px solid var(--color-error-200);
}

.status-banner.error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  border: 1px solid var(--color-error-200);
}

/* 流式光标动画 */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--color-primary-500);
  margin-left: 2px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 流式消息特殊样式 */
.message.streaming {
  opacity: 0.9;
  background: var(--color-primary-25);
}
```

- [ ] **Step 3: Verify CSS is valid**

Run: `cd frontend && npm run build -- --mode development 2>&1 | grep -i error`
Expected: No CSS-related errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(css): status banner and streaming cursor styles"
```

---

### Task 12: 验证和集成测试

**Files:**
- Test: Manual testing scenarios

- [ ] **Step 1: Start both backend and frontend**

Run: `make dev`
Expected: Backend on 8000, frontend on 5173

- [ ] **Step 2: Create a test interview**

1. Open http://localhost:5173
2. Create a job position
3. Start an interview from the job position
4. Open candidate URL in another tab/window

- [ ] **Step 3: Test historical messages load**

1. Send a few messages from candidate
2. Refresh the candidate page
Expected: Previous messages are visible

- [ ] **Step 4: Test message deduplication**

1. Candidate sends a message
Expected: Message appears once in candidate page, once in interviewer page (no duplicates)

- [ ] **Step 5: Test streaming display**

1. Candidate sends an answer
Expected: Interviewer page shows streaming AI question generation with cursor animation

- [ ] **Step 6: Test reconnect**

1. Disconnect network (or close backend briefly)
2. Reconnect
Expected: "正在重新连接..." banner appears, connection restores automatically

- [ ] **Step 7: Test interview end sync**

1. Interviewer clicks "结束面试"
Expected: Both pages show interview ended state

- [ ] **Step 8: Commit integration test documentation**

```bash
git add docs/superpowers/plans/2026-04-20-websocket-sync-optimization.md
git commit -m "docs: add integration test checklist for WebSocket sync optimization"
```

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Task 1: Historical messages API (spec section 1)
- ✅ Task 2-3: Atomic sequence (spec section 2)
- ✅ Task 4: Broadcast error logging (spec section "Error Handling")
- ✅ Task 5: Message type definitions (spec section "Message Types")
- ✅ Task 6: streaming_sync/streaming_end broadcast (spec section 3)
- ✅ Task 7: useWebSocket reconnect+dedup (spec section 4)
- ✅ Task 8: useChat SSE reconnect (spec section 7)
- ✅ Task 9: CandidatePage changes (spec section 5)
- ✅ Task 10: InterviewerPage streaming (spec section 6)
- ✅ Task 11: Status banner CSS (spec UI requirements)

**Placeholder Scan:**
- ✅ No TBD/TODO placeholders
- ✅ All code blocks contain complete implementation
- ✅ All test commands have expected output

**Type Consistency:**
- ✅ WebSocketMessage interface matches all usage
- ✅ ChatMessage fields consistent across backend/frontend
- ✅ InterviewConfig.messages field added to both API and frontend type

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-04-20-websocket-sync-optimization.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**