import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobPositionList } from '../services/api';
import type { JobPositionListItem } from '../types/interview';

export default function JobPositionListPage() {
  const [positions, setPositions] = useState<JobPositionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobPositionList().then((data) => {
      setPositions(data.items);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="loading-spinner"></span>
        <p style={{ marginTop: 'var(--spacing-md)' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h2>岗位库</h2>
        <p style={{ color: 'var(--color-gray-600)', marginTop: 'var(--spacing-sm)' }}>
          管理面试岗位模板，快速创建面试
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-lg)' }}>
        <Link to="/positions/create" className="button">
          新建岗位
        </Link>
      </div>

      {positions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <div className="empty-state-title">暂无岗位模板</div>
          <div className="empty-state-description">
            点击上方按钮创建第一个岗位模板
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
          {positions.map((position) => (
            <div
              key={position.id}
              className="card"
              style={{
                background: 'var(--color-gray-50)',
                border: '1px solid var(--color-gray-200)',
              }}
            >
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{position.name}</h3>
                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                  {position.jd_text_preview}...
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'var(--spacing-md)',
                }}
              >
                <span style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>
                  创建于 {new Date(position.created_at).toLocaleDateString('zh-CN')}
                </span>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <button
                    className="button button-secondary"
                    onClick={() => alert('开始面试功能即将上线')}
                  >
                    开始面试
                  </button>
                  <Link to={`/positions/${position.id}`} className="button button-ghost">
                    查看详情
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
