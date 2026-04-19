import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewHistory } from '../services/api';
import type { InterviewListItem } from '../types/interview';

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    getInterviewHistory().then((data) => {
      setInterviews(data.items);
      setFilteredInterviews(data.items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = interviews;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= filterDate;
      });
    }
    
    setFilteredInterviews(filtered);
  }, [statusFilter, dateFilter, interviews]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2>面试记录</h2>
        <Link to="/config" className="button">
          创建新面试
        </Link>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center', marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
        <div>
          <label className="label" style={{ marginBottom: 'var(--spacing-xs)' }}>状态筛选</label>
          <select 
            className="input" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '120px' }}
          >
            <option value="all">全部</option>
            <option value="pending">待开始</option>
            <option value="ongoing">进行中</option>
            <option value="ended">已结束</option>
          </select>
        </div>
        
        <div>
          <label className="label" style={{ marginBottom: 'var(--spacing-xs)' }}>时间筛选</label>
          <input 
            type="date" 
            className="input" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      </div>
      
      {filteredInterviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">暂无面试记录</div>
          <div className="empty-state-description">
            {statusFilter !== 'all' || dateFilter ? '尝试调整筛选条件' : '点击上方按钮创建新面试'}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-200)' }}>
          {filteredInterviews.map((item, index) => (
            <div 
              key={item.id} 
              className="list-item"
              style={{ 
                borderTop: index === 0 ? 'none' : '1px solid var(--color-gray-200)',
              }}
            >
              <div style={{ flex: 1 }}>
                <p className="list-item-title">{item.jd_text.slice(0, 60)}...</p>
                <p className="list-item-meta">
                  面试官: {item.interviewer_info.slice(0, 20)}... | 
                  时间: {new Date(item.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span className={`status-badge ${
                  item.status === 'ended' ? 'status-badge-neutral' :
                  item.status === 'ongoing' ? 'status-badge-success' : 'status-badge-warning'
                }`}>
                  {item.status === 'pending' ? '待开始' : 
                   item.status === 'ongoing' ? '进行中' : '已结束'}
                </span>
                <Link to={`/detail/${item.id}`} className="button button-ghost">
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}