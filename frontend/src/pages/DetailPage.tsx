import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInterviewDetail } from '../services/api';
import type { InterviewDetail } from '../types/interview';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<InterviewDetail | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getInterviewDetail(id).then((data) => {
        setDetail(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="loading-spinner"></span>
        <p style={{ marginTop: 'var(--spacing-md)' }}>加载中...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">面试不存在</div>
        <Link to="/history" className="button" style={{ marginTop: 'var(--spacing-lg)' }}>
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>面试详情</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            {detail.config.jd_text.slice(0, 50)}...
          </p>
        </div>
        <Link to="/history" className="button button-secondary">
          返回列表
        </Link>
      </div>

      <div role="tablist" aria-label="面试详情选项卡" className="tab-list" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <button 
          role="tab"
          aria-selected={activeTab === 'config'}
          aria-controls="tabpanel-config"
          id="tab-config"
          className="tab-button"
          onClick={() => setActiveTab('config')}
        >
          面试配置
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'chat'}
          aria-controls="tabpanel-chat"
          id="tab-chat"
          className="tab-button"
          onClick={() => setActiveTab('chat')}
        >
          聊天记录
        </button>
        <button 
          role="tab"
          aria-selected={activeTab === 'report'}
          aria-controls="tabpanel-report"
          id="tab-report"
          className="tab-button"
          onClick={() => setActiveTab('report')}
        >
          面试报告
        </button>
      </div>

      <div 
        role="tabpanel" 
        id="tabpanel-config" 
        aria-labelledby="tab-config"
        hidden={activeTab !== 'config'}
        className="tab-panel"
      >
        {activeTab === 'config' && (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>岗位 JD</p>
              <p style={{ fontSize: '0.875rem' }}>{detail.config.jd_text}</p>
            </div>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>公司信息</p>
              <p style={{ fontSize: '0.875rem' }}>{detail.config.company_info}</p>
            </div>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>面试官</p>
              <p style={{ fontSize: '0.875rem' }}>{detail.config.interviewer_info}</p>
            </div>
            <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>流程要求</p>
              <p style={{ fontSize: '0.875rem' }}>{detail.config.process_requirement}</p>
            </div>
            <div className="form-row">
              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>最大问题数</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{detail.config.max_questions}</p>
              </div>
              <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>最大时长</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{detail.config.max_duration / 60} 分钟</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div 
        role="tabpanel" 
        id="tabpanel-chat" 
        aria-labelledby="tab-chat"
        hidden={activeTab !== 'chat'}
        className="tab-panel"
      >
        {activeTab === 'chat' && (
          <div>
            {detail.messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div className="message-role">
                  {msg.role === 'ai' ? 'AI面试官' : 
                   msg.role === 'interviewer' ? '面试官' : '面试者'}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div 
        role="tabpanel" 
        id="tabpanel-report" 
        aria-labelledby="tab-report"
        hidden={activeTab !== 'report'}
        className="tab-panel"
      >
        {activeTab === 'report' && (
          <>
            {detail.report ? (
              <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                  <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>能力评估</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>{detail.report.ability_evaluation}</p>
                </div>
                
                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                  <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>岗位匹配度</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>{detail.report.match_analysis}</p>
                </div>
                
                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                  <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>优缺点总结</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>{detail.report.pros_cons}</p>
                </div>
                
                <div className="card" style={{ background: 'var(--color-primary-50)', borderLeft: '4px solid var(--color-primary-500)' }}>
                  <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-primary-700)' }}>录用建议</h3>
                  <p style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}>
                    结论: {detail.report.final_decision}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>{detail.report.hiring_recommendation}</p>
                </div>
                
                {detail.report.followup_questions && (
                  <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>追问建议</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>{detail.report.followup_questions}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">报告尚未生成</div>
                <div className="empty-state-description">面试结束后可生成分析报告</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}