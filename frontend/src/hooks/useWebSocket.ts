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

  const sendControl = (action: string, data: any = {}) => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'control',
        action,
        ...data,
      }));
    }
  };

  return { connected, lastMessage, sendMessage, sendControl };
}