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
    if (lastMessage?.type === 'chat_sync') {
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
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>面试已结束</h2>
        <p style={{ color: '#64748b' }}>感谢您的参与，祝您一切顺利！</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div style={{ padding: '1rem', background: '#f8fafc' }}>
        <h3>AI面试 - {config?.jd_text?.slice(0, 50)}...</h3>
        <span 
          aria-live="polite" 
          aria-atomic="true"
          style={{ color: connected ? '#22c55e' : '#ef4444' }}
        >
          {connected ? '已连接' : '未连接'}
        </span>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role === 'ai' ? 'AI面试官' : '面试者'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        
        {isStreaming && (
          <div className="message ai">
            <strong>AI面试官:</strong>
            <p>{streamingContent}<span className="streaming-cursor" /></p>
          </div>
        )}
      </div>

      <div className="chat-input">
        {!ready ? (
          <button className="button" onClick={handleReady} style={{ width: '100%' }}>
            准备好了
          </button>
        ) : (
          <>
            <textarea
              className="textarea"
              value={inputText || (isRecording ? transcript : '')}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? '正在录音，请说话...' : '请输入您的回答...'}
              disabled={isStreaming}
              style={{ minHeight: '80px' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                className="button" 
                onClick={isRecording ? handleVoiceStop : handleVoiceStart}
                disabled={isStreaming}
                style={{ background: isRecording ? '#ef4444' : '#f59e0b', flex: 1 }}
              >
                {isRecording ? '停止录音' : '语音输入'}
              </button>
              <button 
                className="button" 
                onClick={handleSend}
                disabled={isStreaming || (!inputText.trim() && !getFullTranscript().trim())}
                style={{ flex: 2 }}
              >
                发送回答
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}