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
  const [resumeExpanded, setResumeExpanded] = useState(false);

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
      <div className="chat-header">
        <div>
          <h3 className="chat-header-title">面试监控</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-xs)' }}>
            {config?.jd_text?.slice(0, 40)}...
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <span 
            aria-live="polite" 
            aria-atomic="true"
            className={`status-badge ${connected ? 'status-badge-success' : 'status-badge-error'}`}
          >
            {connected ? '已连接' : '未连接'}
          </span>
          <span 
            aria-live="polite" 
            aria-atomic="true"
            className={`status-badge ${aiManaged ? 'status-badge-success' : 'status-badge-warning'}`}
          >
            {aiManaged ? 'AI托管' : '手动模式'}
          </span>
        </div>
      </div>

      {config?.candidate_url && (
        <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-primary-50)', borderBottom: '1px solid var(--color-gray-200)' }}>
          <div className="copy-link-area">
            <span className="copy-link-url">{window.location.origin}{config.candidate_url}</span>
            <button
              className="button button-ghost"
              onClick={handleCopyLink}
              style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-700)' }}>
            简历摘要
          </span>
          <button
            className="button button-ghost"
            onClick={() => setResumeExpanded(!resumeExpanded)}
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
          >
            {resumeExpanded ? '收起' : '展开'}
          </button>
        </div>
        {resumeExpanded && (
          <div style={{ marginTop: 'var(--spacing-md)', maxHeight: '200px', overflow: 'auto' }}>
            {config?.resume_text ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)', whiteSpace: 'pre-wrap' }}>
                {config.resume_text}
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                未提供简历信息
              </p>
            )}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">等待候选人加入</div>
            <div className="empty-state-description">分享链接给候选人开始面试</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-role">
                {msg.role === 'ai' ? 'AI面试官' : 
                 msg.role === 'interviewer' ? '面试官' : '面试者'}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      <div className="chat-input">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <button 
            className={`button ${aiManaged ? 'button-secondary' : 'button'}`}
            onClick={handleToggleAI}
          >
            {aiManaged ? '切换手动模式' : '切换AI托管'}
          </button>
          
          <button className="button button-danger" onClick={handleEndInterview}>
            结束面试
          </button>
          
          {interviewEnded && (
            <button className="button button-success" onClick={handleGenerateReport} disabled={reportLoading}>
              {reportLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  生成中...
                </>
              ) : (
                '生成报告'
              )}
            </button>
          )}
        </div>

        <div style={{ opacity: aiManaged ? 0.5 : 1 }}>
          <div className="chat-input-area">
            <textarea
              className="textarea"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={aiManaged ? 'AI托管模式下无法手动提问' : '输入手动提问...'}
              disabled={aiManaged}
              style={{ minHeight: '60px', resize: 'none' }}
            />
            <button 
              className="button"
              onClick={handleManualSend}
              disabled={aiManaged || !manualInput.trim()}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}