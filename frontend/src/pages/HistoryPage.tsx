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
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>;
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>面试记录</h2>
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: '0.5rem' }}>状态筛选:</label>
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
          <label style={{ marginRight: '0.5rem' }}>时间筛选:</label>
          <input 
            type="date" 
            className="input" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem' }}>
        {filteredInterviews.length === 0 ? (
          <p style={{ color: '#64748b' }}>暂无符合条件的面试记录</p>
        ) : (
          filteredInterviews.map((item) => (
            <div key={item.id} style={{ 
              padding: '1rem', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p><strong>{item.jd_text.slice(0, 50)}...</strong></p>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  面试官: {item.interviewer_info} | 
                  状态: {item.status} | 
                  时间: {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <Link to={`/detail/${item.id}`} className="button" style={{ textDecoration: 'none' }}>
                查看详情
              </Link>
            </div>
          ))
        )}
      </div>
      
      <Link to="/" className="button" style={{ marginTop: '1rem', display: 'block', textAlign: 'center', textDecoration: 'none', background: '#64748b' }}>
        返回首页
      </Link>
    </div>
  );
}