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