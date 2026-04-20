import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function ConfigPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/positions');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="card card-elevated" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>流程已更新</h2>
      <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xl)' }}>
        面试创建流程已更新，请先创建岗位模板，再从岗位开始面试
      </p>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <Link to="/positions" className="button button-lg">
          前往岗位库
        </Link>
        <Link to="/positions/create" className="button button-secondary button-lg">
          新建岗位
        </Link>
      </div>
      <p style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
        3秒后自动跳转...
      </p>
    </div>
  );
}