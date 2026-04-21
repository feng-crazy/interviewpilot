import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJobPosition, optimizeContent } from '../services/api';
import type { JobPositionCreateRequest } from '../types/interview';

export default function JobPositionCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JobPositionCreateRequest>({
    name: '',
    jd_text: '',
    company_info: '',
    interviewer_info: '',
    interview_scheme: '',
    default_max_questions: 10,
    default_max_duration: 1800,
  });

  const [optimizeLoading, setOptimizeLoading] = useState({
    jd: false,
    company: false,
    interviewer: false,
    scheme: false,
  });

  function buildContext(fieldType: string, data: typeof formData) {
    const contextFields: Record<string, string[]> = {
      jd: ['company_info', 'interviewer_info', 'interview_scheme'],
      company: ['jd_text', 'interviewer_info', 'interview_scheme'],
      interviewer: ['jd_text', 'company_info', 'interview_scheme'],
      scheme: ['jd_text', 'company_info', 'interviewer_info'],
    };

    const context: Record<string, string> = {};
    for (const field of contextFields[fieldType]) {
      const value = data[field as keyof typeof data];
      if (typeof value === 'string' && value.trim()) {
        context[field] = value;
      }
    }
    return context;
  }

  async function handleOptimize(fieldType: string, currentContent: string) {
    setOptimizeLoading({ ...optimizeLoading, [fieldType]: true });

    try {
      const context = buildContext(fieldType, formData);
      const result = await optimizeContent(fieldType, currentContent, context);

      const fieldNameMap: Record<string, string> = {
        jd: 'jd_text',
        company: 'company_info',
        interviewer: 'interviewer_info',
        scheme: 'interview_scheme',
      };

      setFormData({ ...formData, [fieldNameMap[fieldType]]: result.optimized_content });
    } catch (error) {
      console.error('优化失败:', error);
    } finally {
      setOptimizeLoading({ ...optimizeLoading, [fieldType]: false });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createJobPosition(formData);
      navigate(`/positions/${result.id}`);
    } catch (error) {
      alert('创建岗位失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-elevated" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>创建岗位</h2>
      <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xl)' }}>
        填写岗位信息，创建后可基于此岗位快速发起面试
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>基本信息</h3>

          <div className="form-group">
            <label className="label label-required">岗位名称</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入岗位名称，如：高级前端工程师"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label label-required">岗位 JD</label>
              <button
                type="button"
                className="ai-optimize-button"
                onClick={() => handleOptimize('jd', formData.jd_text)}
                disabled={optimizeLoading.jd}
                title="AI优化"
              >
                {optimizeLoading.jd ? <span className="loading-spinner"></span> : '✨'}
              </button>
            </div>
            <textarea
              className="textarea"
              value={formData.jd_text}
              onChange={(e) => setFormData({ ...formData, jd_text: e.target.value })}
              placeholder="请输入岗位描述、技能要求、工作职责等..."
              rows={16}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label label-required">公司信息</label>
              <button
                type="button"
                className="ai-optimize-button"
                onClick={() => handleOptimize('company', formData.company_info)}
                disabled={optimizeLoading.company}
                title="AI优化"
              >
                {optimizeLoading.company ? <span className="loading-spinner"></span> : '✨'}
              </button>
            </div>
            <textarea
              className="textarea"
              value={formData.company_info}
              onChange={(e) => setFormData({ ...formData, company_info: e.target.value })}
              placeholder="公司名称、行业、业务简介、企业文化等..."
              rows={16}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>面试设置</h3>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label label-required">面试偏好信息</label>
              <button
                type="button"
                className="ai-optimize-button"
                onClick={() => handleOptimize('interviewer', formData.interviewer_info)}
                disabled={optimizeLoading.interviewer}
                title="AI优化"
              >
                {optimizeLoading.interviewer ? <span className="loading-spinner"></span> : '✨'}
              </button>
            </div>
            <textarea
              className="textarea"
              value={formData.interviewer_info}
              onChange={(e) => setFormData({ ...formData, interviewer_info: e.target.value })}
              placeholder="面试官职位、性格特点、提问风格、个人偏好等..."
              rows={16}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label label-required">面试方案</label>
              <button
                type="button"
                className="ai-optimize-button"
                onClick={() => handleOptimize('scheme', formData.interview_scheme)}
                disabled={optimizeLoading.scheme}
                title="AI优化"
              >
                {optimizeLoading.scheme ? <span className="loading-spinner"></span> : '✨'}
              </button>
            </div>
            <textarea
              className="textarea"
              value={formData.interview_scheme}
              onChange={(e) => setFormData({ ...formData, interview_scheme: e.target.value })}
              placeholder="面试轮次、考察重点、考察维度、时间分配、面试方法/工具、其他要求等..."
              rows={16}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>默认约束参数</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="label">默认最大问题数</label>
              <input
                type="number"
                className="input"
                value={formData.default_max_questions}
                onChange={(e) => setFormData({ ...formData, default_max_questions: parseInt(e.target.value) || 10 })}
                min={1}
                max={50}
              />
            </div>
            <div className="form-group">
              <label className="label">默认最大时长（秒）</label>
              <input
                type="number"
                className="input"
                value={formData.default_max_duration}
                onChange={(e) => setFormData({ ...formData, default_max_duration: parseInt(e.target.value) || 1800 })}
                min={60}
                max={7200}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
          <button type="submit" className="button button-lg" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                正在创建...
              </>
            ) : (
              '创建岗位'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
