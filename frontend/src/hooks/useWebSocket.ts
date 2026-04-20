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