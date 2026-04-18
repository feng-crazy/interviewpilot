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
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>;
  }

  if (!detail) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>面试不存在</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <h2>面试详情</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
        <button className="button" onClick={() => setActiveTab('config')} style={{ background: activeTab === 'config' ? '#2563eb' : '#64748b' }}>
          面试配置
        </button>
        <button className="button" onClick={() => setActiveTab('chat')} style={{ background: activeTab === 'chat' ? '#2563eb' : '#64748b' }}>
          聊天记录
        </button>
        <button className="button" onClick={() => setActiveTab('report')} style={{ background: activeTab === 'report' ? '#2563eb' : '#64748b' }}>
          面试报告
        </button>
      </div>

      {activeTab === 'config' && (
        <div>
          <p><strong>岗位 JD:</strong> {detail.config.jd_text}</p>
          <p><strong>公司信息:</strong> {detail.config.company_info}</p>
          <p><strong>面试官:</strong> {detail.config.interviewer_info}</p>
          <p><strong>流程要求:</strong> {detail.config.process_requirement}</p>
          <p><strong>最大问题数:</strong> {detail.config.max_questions}</p>
          <p><strong>最大时长:</strong> {detail.config.max_duration / 60} 分钟</p>
        </div>
      )}

      {activeTab === 'chat' && (
        <div>
          {detail.messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`} style={{ marginBottom: '0.5rem' }}>
              <strong>
                {msg.role === 'ai' ? 'AI面试官' : 
                 msg.role === 'interviewer' ? '面试官' : '面试者'}:
              </strong>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'report' && (
        <div>
          {detail.report ? (
            <>
              <h3>能力评估</h3>
              <p>{detail.report.ability_evaluation}</p>
              
              <h3 style={{ marginTop: '1rem' }}>岗位匹配度</h3>
              <p>{detail.report.match_analysis}</p>
              
              <h3 style={{ marginTop: '1rem' }}>优缺点总结</h3>
              <p>{detail.report.pros_cons}</p>
              
              <h3 style={{ marginTop: '1rem' }}>录用建议</h3>
              <p><strong>结论: {detail.report.final_decision}</strong></p>
              <p>{detail.report.hiring_recommendation}</p>
              
              {detail.report.followup_questions && (
                <>
                  <h3 style={{ marginTop: '1rem' }}>追问建议</h3>
                  <p>{detail.report.followup_questions}</p>
                </>
              )}
            </>
          ) : (
            <p style={{ color: '#64748b' }}>报告尚未生成</p>
          )}
        </div>
      )}

      <Link to="/history" className="button" style={{ marginTop: '1rem', display: 'block', textAlign: 'center', textDecoration: 'none', background: '#64748b' }}>
        返回列表
      </Link>
    </div>
  );
}