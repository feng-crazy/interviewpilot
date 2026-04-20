# WebSocket双端同步优化设计

**Created:** 2026-04-20
**Status:** Draft
**Scope:** Phase 1 + Phase 2 完整优化

## Problem Statement

面试官页面(InterviewerPage)和候选人页面(CandidatePage)的WebSocket同步存在以下问题：

1. **消息重复风险** - CandidatePage发送消息时本地addMessage + WebSocket广播都会添加
2. **sequence竞争** - SSE(chat.py)和WebSocket(websocket.py)同时计算sequence可能冲突
3. **历史消息缺失** - 页面刷新后不加载历史消息
4. **InterviewerPage看不到AI流式生成** - 只有CandidatePage通过SSE看到流式内容
5. **无自动重连机制** - WebSocket/SSE断线后无重连
6. **WebSocket异常吞没** - broadcast失败时异常被静默吞没

## Solution Overview

### Phase 1: 核心修复
- 去重逻辑消除消息重复
- 历史消息加载API
- sequence原子计算

### Phase 2: 体验优化
- InterviewerPage流式显示(WebSocket推送token)
- WebSocket/SSE重连机制
- 连接状态提示

## Design Decisions

### D1: InterviewerPage流式显示方案
**Choice:** WebSocket推送token (方案A)
**Rationale:** 统一WebSocket通道，架构更清晰。每100ms批量推送减少高频消息负载。

### D2: 重连机制方案
**Choice:** 立即重连+上限 (方案B)
**Rationale:** 面试场景实时性强，快速恢复更重要。第1次立即重连，后续等待2s，最多5次后提示用户刷新。

### D3: 历史消息加载方案
**Choice:** 扩展detail API (方案B)
**Rationale:** 面试消息量通常几十条，一次性加载合理。`/api/interview/{id}/detail`已是详情页入口，自然包含消息。

---

## Architecture

### 改动后的同步架构

```
前端改动:
┌──────────────────┐              ┌──────────────────┐
│ CandidatePage    │              │ InterviewerPage  │
│ - useChat (SSE)  │              │ - useWebSocket   │
│ - useWebSocket   │              │ - 历史消息加载    │
│ - 历史消息加载    │              │ - 去重逻辑       │
│ - 去重逻辑       │              │ - 重连机制       │
│ - 重连机制       │              │ - 流式显示       │
└──────────────────┘              └──────────────────┘

后端改动:
┌──────────────────┐              ┌──────────────────┐
│ chat.py          │              │ websocket.py     │
│ - SSE流式推送     │              │ - sequence原子   │
│ - token广播      │              │ - 新增消息类型    │
│ - done广播       │              │   streaming_sync │
└──────────────────┘              └──────────────────┘

┌──────────────────┐              ┌──────────────────┐
│ interview.py     │              │ useWebSocket.ts  │
│ - detail返回消息  │              │ - 重连机制       │
└──────────────────┘              │ - 去重检查       │
                                 │ - 连接状态提示    │
                                 └──────────────────┘
```

---

## Message Types

### WebSocket消息类型定义

```typescript
interface WebSocketMessage {
  type: 'chat_sync' | 'streaming_sync' | 'streaming_end' | 'control_update' | 'interview_ended' | 'error';
  
  // chat_sync - 完整消息同步 (候选人/面试官消息)
  message?: {
    id: string;
    sequence: number;
    role: 'ai' | 'interviewer' | 'candidate';
    content: string;
    source: string;
    created_at: string;
  };
  
  // streaming_sync - AI流式token (新增)
  message_id?: string;      // 正在生成的消息ID
  content?: string;         // 累积的token
  is_start?: boolean;       // 开始生成标志
  
  // streaming_end - 流式结束 (新增，替代chat_sync用于AI消息)
  final_message?: {
    id: string;
    sequence: number;
    role: 'ai';
    content: string;
    source: 'ai_generated';
    created_at: string;
  };
  
  // control_update - 控制状态更新
  ai_managed?: boolean;
  
  // interview_ended - 面试结束
  // error - 错误
  message?: string;         // 错误消息
}
```

---

## Data Flow

### AI问题生成流程 (改动后)

```
CandidatePage发送回答
    │
    ▼
WebSocket: chat_message → websocket.py
    │
    ├─► DB保存候选人消息 (sequence原子计算)
    ├─► broadcast chat_sync (双端同步)
    │
    ▼
CandidatePage: setTimeout(500ms) → startStream() (SSE)
    │
    ▼
GET /api/chat/stream/{id}
    │
    ├─► SSE: event="token" → CandidatePage流式显示 (保持不变)
    │
    ├─► 每100ms: broadcast streaming_sync → InterviewerPage流式显示 (新增)
    │   { type: 'streaming_sync', message_id, content: '累积token', is_start }
    │
    ├─► SSE: event="done" → CandidatePage完整消息 (保持不变)
    │
    ├─► broadcast streaming_end → InterviewerPage完整消息 (新增)
    │   { type: 'streaming_end', final_message }
    │
    ▼
DB保存AI消息 (sequence原子计算)
```

---

## Implementation Details

### 1. 历史消息加载 (interview.py)

**改动:** `/api/interview/{id}/detail` 响应添加 `messages` 字段

```python
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
        
        # 新增字段
        "messages": [
            {
                "id": msg.id,
                "sequence": msg.sequence,
                "role": msg.role,
                "content": msg.content,
                "source": msg.source,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ]
    }
```

### 2. Sequence原子计算 (websocket.py + chat.py)

**改动:** 使用数据库原子查询替代Python计算

```python
# websocket.py:43-49 改为:
from sqlalchemy import func

sequence = db.query(func.max(ChatMessage.sequence)).filter(
    ChatMessage.interview_id == interview_id
).scalar() or 0
sequence += 1

# chat.py:93-99 同样改动
```

### 3. SSE流式推送WebSocket (chat.py)

**改动:** SSE生成时每100ms推送streaming_sync

```python
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
    
    async for token in llm_service.generate_stream(prompt):
        full_response += token
        accumulated_tokens += token
        yield ServerSentEvent(data=json.dumps({"content": token}), event="token")
        
        # 每100ms批量推送
        current_time = time.time()
        if current_time - last_broadcast_time >= 0.1:
            await ws_manager.broadcast(interview_id, {
                "type": "streaming_sync",
                "message_id": message_id,
                "content": accumulated_tokens,
            })
            last_broadcast_time = current_time
    
    # 处理QUESTION或END
    if "QUESTION:" in full_response:
        question_content = full_response.replace("QUESTION:", "").strip()
        
        # sequence原子计算
        sequence = db.query(func.max(ChatMessage.sequence)).filter(
            ChatMessage.interview_id == interview_id
        ).scalar() or 0
        sequence += 1
        
        ai_message = ChatMessage(
            id=message_id,
            interview_id=interview_id,
            sequence=sequence,
            role="ai",
            content=question_content,
            source="ai_generated",
        )
        db.add(ai_message)
        db.commit()
        
        yield ServerSentEvent(data=json.dumps({...}), event="done")
        
        # 新增: streaming_end替代chat_sync
        await ws_manager.broadcast(interview_id, {
            "type": "streaming_end",
            "final_message": {
                "id": ai_message.id,
                "sequence": ai_message.sequence,
                "role": "ai",
                "content": question_content,
                "source": "ai_generated",
                "created_at": ai_message.created_at.isoformat(),
            },
        })
```

### 4. 重连机制 (useWebSocket.ts)

**改动:** 立即重连 + 上限控制

```typescript
interface ReconnectState {
  attemptCount: number;
  maxAttempts: number;
  baseDelay: number;
  isReconnecting: boolean;
  showReconnectPrompt: boolean;
}

export function useWebSocket(interviewId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);
  const [receivedMessageIds, setReceivedMessageIds] = useState<Set<string>>(new Set());
  
  const reconnectState = useRef<ReconnectState>({
    attemptCount: 0,
    maxAttempts: 5,
    baseDelay: 2000,
    isReconnecting: false,
    showReconnectPrompt: false,
  });
  
  const createConnection = useCallback(() => {
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/interview/${interviewId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setConnected(true);
      setIsReconnecting(false);
      reconnectState.current.attemptCount = 0;
    };
    
    ws.onclose = () => {
      setConnected(false);
      
      if (reconnectState.current.attemptCount < reconnectState.current.maxAttempts) {
        setIsReconnecting(true);
        reconnectState.current.attemptCount++;
        
        const delay = reconnectState.current.attemptCount === 1 ? 0 : reconnectState.current.baseDelay;
        setTimeout(() => {
          if (reconnectState.current.attemptCount <= reconnectState.current.maxAttempts) {
            createConnection();
          }
        }, delay);
      } else {
        setIsReconnecting(false);
        setShowReconnectPrompt(true);
      }
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // 去重逻辑
      if (data.type === 'chat_sync' || data.type === 'streaming_end') {
        const msgId = data.message?.id || data.final_message?.id;
        if (msgId && receivedMessageIds.current.has(msgId)) {
          return;
        }
        if (msgId) {
          setReceivedMessageIds(prev => new Set(prev).add(msgId));
        }
      }
      
      setLastMessage(data);
    };
    
    ws.onerror = () => {
      // 不触发重连，等onclose处理
    };
  }, [interviewId]);
  
  useEffect(() => {
    createConnection();
    return () => wsRef.current?.close();
  }, [createConnection]);
  
  // 初始化历史消息ID (用于去重)
  const initializeMessageIds = useCallback((messages: ChatMessage[]) => {
    const ids = new Set(messages.map(m => m.id));
    setReceivedMessageIds(ids);
  }, []);
  
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
  
  const sendControl = (action: string, data: any = {}) => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'control',
        action,
        ...data,
      }));
    }
  };
  
  return {
    connected,
    lastMessage,
    sendMessage,
    sendControl,
    isReconnecting,
    showReconnectPrompt,
    reconnectAttempt: reconnectState.current.attemptCount,
    maxReconnectAttempts: reconnectState.current.maxAttempts,
    initializeMessageIds,
  };
}
```

### 5. CandidatePage改动

**改动:** 加载历史消息、移除发送时本地添加、处理新消息类型

```typescript
const [historicalMessagesLoaded, setHistoricalMessagesLoaded] = useState(false);

const { 
  messages, 
  streamingContent, 
  isStreaming, 
  startStream, 
  addMessage 
} = useChat(id || '');

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

// 加载历史消息
useEffect(() => {
  if (id) {
    getInterviewConfig(id).then((data) => {
      setConfig(data);
      // 新增: 加载历史消息
      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(msg => addMessage(msg));
        initializeMessageIds(data.messages);
      }
      setHistoricalMessagesLoaded(true);
    });
  }
}, [id, addMessage, initializeMessageIds]);

// WebSocket消息处理
useEffect(() => {
  if (lastMessage?.type === 'chat_sync') {
    addMessage(lastMessage.message);  // 去重已在hook中处理
  }
  if (lastMessage?.type === 'streaming_end') {
    addMessage(lastMessage.final_message);
  }
  if (lastMessage?.type === 'interview_ended') {
    setInterviewEnded(true);
  }
}, [lastMessage, addMessage]);

// 发送消息 - 移除本地addMessage
const handleSend = () => {
  const textToSend = inputText.trim() || getFullTranscript().trim();
  if (textToSend) {
    sendMessage('candidate', textToSend, voiceMode ? 'voice' : 'text');
    // 移除: addMessage({...}) - 依赖WebSocket chat_sync同步
    setInputText('');
    stopRecording();
    setVoiceMode(false);
    if (historicalMessagesLoaded) {
      setTimeout(() => startStream(), 500);
    }
  }
};

// 连接状态提示
{isReconnecting && (
  <div className="status-banner reconnecting">
    正在重新连接... ({reconnectAttempt}/{maxReconnectAttempts})
  </div>
)}
{showReconnectPrompt && (
  <div className="status-banner disconnected">
    连接中断，请刷新页面
  </div>
)}
```

### 6. InterviewerPage改动

**改动:** 加载历史消息、处理流式显示、新增streaming状态

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
const [streamingContent, setStreamingContent] = useState('');
const [historicalMessagesLoaded, setHistoricalMessagesLoaded] = useState(false);

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

// 加载历史消息
useEffect(() => {
  if (id) {
    getInterviewConfig(id).then((data) => {
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

// WebSocket消息处理
useEffect(() => {
  if (lastMessage?.type === 'chat_sync') {
    setMessages(prev => [...prev, lastMessage.message]);
  }
  if (lastMessage?.type === 'streaming_sync') {
    if (lastMessage.is_start) {
      setStreamingMessageId(lastMessage.message_id);
      setStreamingContent('');
    } else if (lastMessage.message_id === streamingMessageId) {
      setStreamingContent(lastMessage.content || '');
    }
  }
  if (lastMessage?.type === 'streaming_end') {
    setMessages(prev => [...prev, lastMessage.final_message]);
    setStreamingMessageId(null);
    setStreamingContent('');
  }
  if (lastMessage?.type === 'control_update') {
    setAiManaged(lastMessage.ai_managed);
  }
  if (lastMessage?.type === 'interview_ended') {
    setInterviewEnded(true);
  }
}, [lastMessage, streamingMessageId]);

// 流式显示渲染
{streamingMessageId && (
  <div className="message ai streaming">
    <div className="message-role">AI面试官</div>
    <div className="message-content">
      {streamingContent}<span className="streaming-cursor" />
    </div>
  </div>
)}

// 连接状态提示 (同CandidatePage)
```

### 7. SSE重连机制 (useChat.ts)

**改动:** 立即重连 + 上限控制

```typescript
export function useChat(interviewId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const reconnectState = useRef({
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
    
    eventSource.addEventListener('token', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.content) {
        setStreamingContent(prev => prev + data.content);
      }
    });
    
    eventSource.addEventListener('done', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.message_id) {
        setMessages(prev => [...prev, {
          id: data.message_id,
          role: data.role,
          content: data.content,
        }]);
        setIsStreaming(false);
        setStreamingContent('');
        reconnectState.current.attemptCount = 0;
        eventSource.close();
      }
    });
    
    eventSource.addEventListener('end', () => {
      setIsStreaming(false);
      eventSource.close();
    });
    
    eventSource.onerror = () => {
      eventSource.close();
      
      if (reconnectState.current.attemptCount < reconnectState.current.maxAttempts) {
        reconnectState.current.attemptCount++;
        const delay = reconnectState.current.attemptCount === 1 ? 0 : reconnectState.current.baseDelay;
        setTimeout(() => {
          createEventSource();
        }, delay);
      } else {
        setIsStreaming(false);
        // 可选: 设置错误状态提示用户
      }
    };
  }, [interviewId]);
  
  const startStream = useCallback(() => {
    reconnectState.current.attemptCount = 0;
    createEventSource();
  }, [createEventSource]);
  
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);
  
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

---

## Error Handling

### WebSocket广播失败日志 (websocket_manager.py)

```python
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
            self.active_connections[interview_id].discard(conn)
```

---

## Testing Strategy

### 单元测试
- `test_sequence_atomic`: 验证并发sequence计算正确性
- `test_message_deduplication`: 验证去重逻辑
- `test_reconnect_mechanism`: 验证重连次数和延迟

### 集成测试
- `test_historical_messages_load`: 验证页面加载历史消息
- `test_streaming_sync`: 验证InterviewerPage收到流式内容
- `test_websocket_sse_coordination`: 验证双通道配合

### 手动测试场景
1. 页面刷新后历史消息显示
2. 断网后自动重连
3. 候选人发送消息无重复
4. 面试官实时看到AI生成问题
5. 网络波动下消息顺序正确

---

## Migration Notes

### 前端兼容性
- 新增`initializeMessageIds`需在页面加载时调用
- `streaming_sync`消息类型需处理
- 去重逻辑依赖`message.id`，历史消息必须包含此字段

### 后端兼容性
- `detail` API响应新增`messages`字段，不影响现有调用方（向后兼容）
- `streaming_sync`消息类型对旧版前端无影响（未处理即忽略）
- sequence计算逻辑改动不影响数据结构

---

## Files to Modify

| 文件 | 改动类型 | 改动内容 |
|------|----------|----------|
| `backend/app/api/routes/interview.py` | 扩展 | `/detail`返回messages |
| `backend/app/api/routes/websocket.py` | 改进 | sequence原子计算 |
| `backend/app/api/routes/chat.py` | 新增 | streaming_sync/streaming_end广播 |
| `backend/app/services/websocket_manager.py` | 改进 | broadcast失败日志 |
| `frontend/src/hooks/useWebSocket.ts` | 重构 | 重连+去重+状态提示 |
| `frontend/src/hooks/useChat.ts` | 改进 | SSE重连机制 |
| `frontend/src/pages/CandidatePage.tsx` | 改进 | 历史加载+移除重复添加 |
| `frontend/src/pages/InterviewerPage.tsx` | 改进 | 历史加载+流式显示 |
| `frontend/src/types/interview.ts` | 扩展 | 新消息类型定义 |