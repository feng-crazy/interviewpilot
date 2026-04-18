import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { getInterviewConfig, toggleAiManaged, endInterview, generateReport } from '../services/api';
import type { InterviewConfig, ChatMessage } from '../types/interview';

export default function InterviewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiManaged, setAiManaged] = useState(true);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { connected, lastMessage, sendMessage, sendControl } = useWebSocket(id || '');

  useEffect(() => {
    if (id) {
      getInterviewConfig(id).then((data) => {
        setConfig(data);
        setAiManaged(data.ai_managed);
      });
    }
  }, [id]);

  useEffect(() => {
    if (lastMessage?.type === 'chat_sync') {
      setMessages((prev) => [...prev, lastMessage.message]);
    }
    if (lastMessage?.type === 'control_update' && lastMessage.ai_managed !== undefined) {
      setAiManaged(lastMessage.ai_managed);
    }
    if (lastMessage?.type === 'interview_ended') {
      setInterviewEnded(true);
    }
  }, [lastMessage]);

  const handleToggleAI = async () => {
    const newState = !aiManaged;
    sendControl('toggle_ai_managed', { ai_managed: newState });
    await toggleAiManaged(id || '', newState);
    setAiManaged(newState);
  };

  const handleEndInterview = async () => {
    sendControl('end_interview');
    await endInterview(id || '');
    setInterviewEnded(true);
  };

  const handleManualSend = () => {
    if (manualInput.trim() && !aiManaged) {
      sendMessage('interviewer', manualInput.trim());
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        sequence: prev.length + 1,
        role: 'interviewer',
        content: manualInput.trim(),
        source: 'manual',
        created_at: new Date().toISOString(),
      }]);
      setManualInput('');
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const result = await generateReport(id || '');
      alert(`报告已生成！结论: ${result.final_decision}`);
      navigate(`/detail/${id}`);
    } catch (error: any) {
      alert(error.response?.data?.detail || '报告生成失败');
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (config?.candidate_url) {
      const fullUrl = `${window.location.origin}${config.candidate_url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="chat-container">
      <div style={{ padding: '1rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>面试监控 - {config?.jd_text?.slice(0, 30)}...</h3>
          <span style={{ color: connected ? '#22c55e' : '#ef4444' }}>
            {connected ? '已连接' : '未连接'}
          </span>
          <span style={{ marginLeft: '1rem', color: aiManaged ? '#2563eb' : '#f59e0b' }}>
            {aiManaged ? 'AI托管' : '手动模式'}
          </span>
          {config?.candidate_url && (
            <span style={{ marginLeft: '1rem' }}>
              候选人链接: {window.location.origin}{config.candidate_url}
              <button
                className="button"
                onClick={handleCopyLink}
                style={{ marginLeft: '0.5rem', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="button" 
            onClick={handleToggleAI}
            style={{ background: aiManaged ? '#f59e0b' : '#2563eb' }}
          >
            {aiManaged ? '取消AI托管' : '继续AI托管'}
          </button>
          
          <button className="button" onClick={handleEndInterview} style={{ background: '#ef4444' }}>
            结束面试
          </button>
          
          {interviewEnded && (
            <button className="button" onClick={handleGenerateReport} disabled={reportLoading}>
              {reportLoading ? '生成中...' : '总结面试'}
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>
              {msg.role === 'ai' ? 'AI面试官' : 
               msg.role === 'interviewer' ? '面试官' : '面试者'}:
            </strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <div style={{ opacity: aiManaged ? 0.5 : 1 }}>
          <textarea
            className="textarea"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={aiManaged ? 'AI托管模式下无法手动提问' : '输入手动提问...'}
            disabled={aiManaged}
            style={{ minHeight: '60px' }}
          />
          <button 
            className="button" 
            onClick={handleManualSend}
            disabled={aiManaged || !manualInput.trim()}
            style={{ marginTop: '0.5rem' }}
          >
            发送问题
          </button>
        </div>
      </div>
    </div>
  );
}