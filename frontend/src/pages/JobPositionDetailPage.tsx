import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJobPosition, updateJobPosition, deleteJobPosition } from '../services/api';
import ResumeUploadModal from '../components/ResumeUploadModal';
import type { JobPosition, JobPositionUpdateRequest } from '../types/interview';

export default function JobPositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [position, setPosition] = useState<JobPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [formData, setFormData] = useState<JobPositionUpdateRequest>({});

  useEffect(() => {
    if (id) {
      fetchPosition();
    }
  }, [id]);

  const fetchPosition = async () => {
    try {
      const data = await getJobPosition(id!);
      setPosition(data);
      setFormData({
        name: data.name,
        jd_text: data.jd_text,
        company_info: data.company_info,
        interviewer_info: data.interviewer_info,
        interview_scheme: data.interview_scheme,
        default_max_questions: data.default_max_questions,
        default_max_duration: data.default_max_duration,
      });
    } catch (error) {
      console.error('Failed to fetch position:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateJobPosition(id, formData);
      await fetchPosition();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update position:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteJobPosition(id);
      navigate('/positions');
    } catch (error) {
      console.error('Failed to delete position:', error);
    }
  };

  const handleStartInterview = () => {
    setShowResumeModal(true);
  };

  const handleInterviewCreated = (interviewId: string) => {
    navigate(`/interview/${interviewId}/interviewer`);
  };

  const handleInputChange = (field: keyof JobPositionUpdateRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="loading-spinner"></span>
        <p style={{ marginTop: 'var(--spacing-md)' }}>加载中...</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">岗位不存在</div>
        <Link to="/positions" className="button" style={{ marginTop: 'var(--spacing-lg)' }}>
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="card card-elevated" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>岗位详情</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            创建于 {new Date(position.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <Link to="/positions" className="button button-secondary">
            返回列表
          </Link>
          <button
            className="button button-primary"
            onClick={handleStartInterview}
          >
            开始面试
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--color-gray-200)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {!isEditing ? (
            <button
              className="button button-secondary"
              onClick={() => setIsEditing(true)}
            >
              编辑
            </button>
          ) : (
            <>
              <button
                className="button button-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
              <button
                className="button button-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: position.name,
                    jd_text: position.jd_text,
                    company_info: position.company_info,
                    interviewer_info: position.interviewer_info,
                    interview_scheme: position.interview_scheme,
                    default_max_questions: position.default_max_questions,
                    default_max_duration: position.default_max_duration,
                  });
                }}
              >
                取消
              </button>
            </>
          )}
        </div>
        <button
          className="button"
          style={{ backgroundColor: 'var(--color-error-500)', color: 'white' }}
          onClick={() => setShowDeleteConfirm(true)}
        >
          删除岗位
        </button>
      </div>

      {/* Content Sections */}
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        {/* 岗位名称 */}
        <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>岗位名称</p>
          {isEditing ? (
            <input
              type="text"
              className="form-input"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              style={{ fontSize: '0.875rem', fontWeight: '600' }}
            />
          ) : (
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{position.name}</p>
          )}
        </div>

        {/* 岗位JD */}
        <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>岗位JD</p>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.jd_text || ''}
              onChange={(e) => handleInputChange('jd_text', e.target.value)}
              rows={6}
              style={{ fontSize: '0.875rem', width: '100%', resize: 'vertical' }}
            />
          ) : (
            <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{position.jd_text}</p>
          )}
        </div>

        {/* 公司信息 */}
        <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>公司信息</p>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.company_info || ''}
              onChange={(e) => handleInputChange('company_info', e.target.value)}
              rows={4}
              style={{ fontSize: '0.875rem', width: '100%', resize: 'vertical' }}
            />
          ) : (
            <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{position.company_info}</p>
          )}
        </div>

        {/* 面试偏好信息 */}
        <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>面试偏好信息</p>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.interviewer_info || ''}
              onChange={(e) => handleInputChange('interviewer_info', e.target.value)}
              rows={4}
              style={{ fontSize: '0.875rem', width: '100%', resize: 'vertical' }}
            />
          ) : (
            <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{position.interviewer_info}</p>
          )}
        </div>

        {/* 面试方案 */}
        <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>面试方案</p>
          {isEditing ? (
            <textarea
              className="form-textarea"
              value={formData.interview_scheme || ''}
              onChange={(e) => handleInputChange('interview_scheme', e.target.value)}
              rows={4}
              style={{ fontSize: '0.875rem', width: '100%', resize: 'vertical' }}
            />
          ) : (
            <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{position.interview_scheme}</p>
          )}
        </div>

        {/* 默认约束 */}
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>默认最大问题数</p>
            {isEditing ? (
              <input
                type="number"
                className="form-input"
                value={formData.default_max_questions || ''}
                onChange={(e) => handleInputChange('default_max_questions', parseInt(e.target.value) || 0)}
                style={{ fontSize: '0.875rem', fontWeight: '600' }}
              />
            ) : (
              <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{position.default_max_questions}</p>
            )}
          </div>
          <div style={{ padding: 'var(--spacing-md)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xs)' }}>默认最大时长（分钟）</p>
            {isEditing ? (
              <input
                type="number"
                className="form-input"
                value={formData.default_max_duration || ''}
                onChange={(e) => handleInputChange('default_max_duration', parseInt(e.target.value) || 0)}
                style={{ fontSize: '0.875rem', fontWeight: '600' }}
              />
            ) : (
              <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{position.default_max_duration}</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>确认删除</h3>
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-gray-600)' }}>
              确定要删除岗位 "{position.name}" 吗？此操作不可撤销。
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
              <button
                className="button button-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button
                className="button"
                style={{ backgroundColor: 'var(--color-error-500)', color: 'white' }}
                onClick={handleDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <ResumeUploadModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        jobPositionId={id!}
        onStartInterview={handleInterviewCreated}
      />
    </div>
  );
}
