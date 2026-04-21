import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewHistory, deleteInterview } from '../services/api';
import type { InterviewListItem } from '../types/interview';

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchInterviews = async (page: number, status: string, date: string) => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    const data = await getInterviewHistory(PAGE_SIZE, offset, status, date);
    setInterviews(data.items);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => {
    fetchInterviews(currentPage, statusFilter, dateFilter);
  }, [currentPage, statusFilter, dateFilter]);

  useEffect(() => {
    if (statusFilter !== 'all' || dateFilter) {
      setCurrentPage(1);
    }
  }, [statusFilter, dateFilter]);

  const handleDelete = async (interviewId: string) => {
    if (!window.confirm('确定要删除这条面试记录吗？此操作不可撤销。')) {
      return;
    }
    try {
      await deleteInterview(interviewId);
      fetchInterviews(currentPage, statusFilter, dateFilter);
    } catch (error) {
      alert('删除失败，请稍后重试');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (total <= PAGE_SIZE) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <span className="pagination-info">
          共 {total} 条记录，第 {currentPage}/{totalPages} 页
        </span>

        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          首页
        </button>

        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </button>

        {startPage > 1 && (
          <span style={{ color: 'var(--color-gray-500)' }}>...</span>
        )}

        {pages.map((page) => (
          <button
            key={page}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <span style={{ color: 'var(--color-gray-500)' }}>...</span>
        )}

        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </button>

        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          末页
        </button>
      </div>
    );
  };

  if (loading && interviews.length === 0) {
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

      {interviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">暂无面试记录</div>
          <div className="empty-state-description">
            {statusFilter !== 'all' || dateFilter ? '尝试调整筛选条件' : '点击上方按钮创建新面试'}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-200)' }}>
          {interviews.map((item, index) => (
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
                {item.status === 'ended' && (
                  <button
                    className="button button-ghost"
                    style={{ color: 'var(--color-error-600)' }}
                    onClick={() => handleDelete(item.id)}
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {renderPagination()}
    </div>
  );
}