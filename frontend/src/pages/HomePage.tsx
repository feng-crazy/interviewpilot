import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div>
      <div className="hero">
        <h1 className="hero-title">InterviewPilot</h1>
        <p className="hero-subtitle">
          企业AI面试智能体，自动化初面流程，生成人才画像与录用建议
        </p>
        
        <div className="hero-actions">
          <Link to="/config" className="button button-lg">
            开始创建面试
          </Link>
          
          <Link to="/history" className="button button-secondary button-lg">
            查看面试记录
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>功能介绍</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div className="card" style={{ background: 'var(--color-gray-50)' }}>
            <h3>AI驱动面试</h3>
            <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginTop: 'var(--spacing-sm)' }}>
              根据岗位JD自动生成面试问题，智能追问，深度评估候选人能力
            </p>
          </div>
          
          <div className="card" style={{ background: 'var(--color-gray-50)' }}>
            <h3>双端同步</h3>
            <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginTop: 'var(--spacing-sm)' }}>
              面试官可实时观看候选人答题过程，随时切换手动/AI托管模式
            </p>
          </div>
          
          <div className="card" style={{ background: 'var(--color-gray-50)' }}>
            <h3>人才画像</h3>
            <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginTop: 'var(--spacing-sm)' }}>
              自动生成能力评估、岗位匹配度分析、录用建议与追问方向
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}