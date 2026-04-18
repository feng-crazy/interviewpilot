import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'ai' | 'interviewer' | 'candidate';
  content: string;
  isStreaming?: boolean;
}

export function useChat(interviewId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/stream/${interviewId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    setStreamingContent('');
    setIsStreaming(true);

    // Listen for 'token' events (streaming content)
    eventSource.addEventListener('token', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.content) {
        setStreamingContent((prev) => prev + data.content);
      }
    });

    // Listen for 'done' events (complete AI message)
    eventSource.addEventListener('done', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.message_id) {
        setMessages((prev) => [...prev, {
          id: data.message_id,
          role: data.role,
          content: data.content,
        }]);
        setIsStreaming(false);
        setStreamingContent('');
      }
    });

    // Listen for 'end' events (interview ended)
    eventSource.addEventListener('end', (event: MessageEvent) => {
      setIsStreaming(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setIsStreaming(false);
      eventSource.close();
    };
  };

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return { messages, streamingContent, isStreaming, startStream, addMessage };
}