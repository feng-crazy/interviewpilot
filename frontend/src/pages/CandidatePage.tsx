import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getInterviewConfig } from '../services/api';
import type { InterviewConfig } from '../types/interview';

export default function CandidatePage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [inputText, setInputText] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  const { messages, streamingContent, isStreaming, startStream, addMessage } = useChat(id || '');
  const { connected, lastMessage, sendMessage } = useWebSocket(id || '');
  const { isRecording, transcript, finalTranscript, startRecording, stopRecording, getFullTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (id) {
      getInterviewConfig(id).then(setConfig);
    }
  }, [id]);

  useEffect(() => {
    if (lastMessage?.type === 'chat_sync' && lastMessage.message) {
      addMessage(lastMessage.message);
    }
    if (lastMessage?.type === 'interview_ended') {
      setInterviewEnded(true);
    }
  }, [lastMessage, addMessage]);

  useEffect(() => {
    if (voiceMode && finalTranscript) {
      setInputText(prev => prev + finalTranscript);
    }
  }, [finalTranscript, voiceMode]);

  const handleReady = () => {
    setReady(true);
    startStream();
  };

  const handleSend = () => {
    const textToSend = inputText.trim() || getFullTranscript().trim();
    if (textToSend) {
      sendMessage('candidate', textToSend, voiceMode ? 'voice' : 'text');
      addMessage({
        id: Date.now().toString(),
        role: 'candidate',
        content: textToSend,
        sequence: messages.length + 1,
        source: 'manual',
        input_type: voiceMode ? 'voice' : 'text',
        created_at: new Date().toISOString(),
      });
      setInputText('');
      stopRecording();
      setVoiceMode(false);
      setTimeout(() => startStream(), 500);
    }
  };

  const handleVoiceStart = async () => {
    setVoiceMode(true);
    setInputText('');
    await startRecording();
  };

  const handleVoiceStop = () => {
    stopRecording();
    const text = getFullTranscript().trim();
    if (text) {
      setInputText(text);
    }
  };

  if (interviewEnded) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', maxWidth: '600px', margin: '0 auto' }}>
        <div className="empty-state-icon">✓</div>
        <h2>面试已结束</h2>
        <p style={{ color: 'var(--color-gray-600)', marginTop: 'var(--spacing-md)' }}>
          感谢您的参与，祝您一切顺利！
        </p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h3 className="chat-header-title">AI面试</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-xs)' }}>
            {config?.job_position_id ? `岗位ID: ${config?.job_position_id?.slice(0, 8)}...` : '面试进行中'}
          </p>
        </div>
        <span 
          aria-live="polite" 
          aria-atomic="true"
          className={`status-badge ${connected ? 'status-badge-success' : 'status-badge-error'}`}
        >
          {connected ? '已连接' : '未连接'}
        </span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-role">
              {msg.role === 'ai' ? 'AI面试官' : '面试者'}
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        
        {isStreaming && (
          <div className="message ai">
            <div className="message-role">AI面试官</div>
            <div className="message-content">
              {streamingContent}<span className="streaming-cursor" />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        {!ready ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem' }}>
              面试即将开始，请准备好您的回答
            </p>
            <button className="button button-lg" onClick={handleReady}>
              我准备好了
            </button>
          </div>
        ) : (
          <div className="chat-input-area">
            <textarea
              className="textarea"
              value={inputText || (isRecording ? transcript : '')}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? '正在录音，请说话...' : '请输入您的回答...'}
              disabled={isStreaming}
              style={{ minHeight: '60px', resize: 'none' }}
            />
            <div className="chat-input-actions">
              <button 
                className={`button ${isRecording ? 'button-danger' : 'button-secondary'}`}
                onClick={isRecording ? handleVoiceStop : handleVoiceStart}
                disabled={isStreaming}
                style={{ minWidth: '80px' }}
              >
                {isRecording ? '停止' : '语音'}
              </button>
              <button 
                className="button"
                onClick={handleSend}
                disabled={isStreaming || (!inputText.trim() && !getFullTranscript().trim())}
              >
                发送
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}