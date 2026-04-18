import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>InterviewPilot</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        企业AI面试智能体
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/config" className="button" style={{ textDecoration: 'none' }}>
          创建面试
        </Link>
        
        <Link to="/history" className="button" 
          style={{ textDecoration: 'none', background: '#64748b' }}>
          面试记录
        </Link>
      </div>
    </div>
  );
}