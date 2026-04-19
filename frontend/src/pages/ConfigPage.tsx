import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview, optimizeContent } from '../services/api';

type FormData = {
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  process_requirement: string;
  max_questions: number;
  max_duration: number;
};

export default function ConfigPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [optimizeLoading, setOptimizeLoading] = useState({
    jd: false,
    company: false,
    interviewer: false,
    process: false,
  });
  const [formData, setFormData] = useState<FormData>({
    jd_text: '',
    company_info: '',
    interviewer_info: '',
    process_requirement: '',
    max_questions: 10,
    max_duration: 30,
  });

  function buildContext(fieldType: string, formData: FormData) {
    const contextFields: Record<string, string[]> = {
      jd: ['company_info', 'interviewer_info', 'process_requirement'],
      company: ['jd_text', 'interviewer_info', 'process_requirement'],
      interviewer: ['jd_text', 'company_info', 'process_requirement'],
      process: ['jd_text', 'company_info', 'interviewer_info'],
    };

    const context: Record<string, string> = {};
    for (const field of contextFields[fieldType]) {
      const value = formData[field as keyof typeof formData];
      if (typeof value === 'string' && value.trim()) {
        context[field] = value;
      }
    }
    return context;
  }

  async function handleOptimize(fieldType: string, currentContent: string) {
    const context = buildContext(fieldType, formData);
    if (!currentContent.trim() && Object.keys(context).length === 0) {
      alert('请先输入内容或填写其他配置项');
      return;
    }

    setOptimizeLoading({ ...optimizeLoading, [fieldType]: true });

    try {
      const result = await optimizeContent(fieldType, currentContent, context);

      const fieldNameMap: Record<string, string> = {
        jd: 'jd_text',
        company: 'company_info',
        interviewer: 'interviewer_info',
        process: 'process_requirement',
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
      const constraint_info = JSON.stringify({
        max_questions: formData.max_questions,
        max_duration: formData.max_duration * 60,
      });

      const result = await createInterview({
        jd_text: formData.jd_text,
        company_info: formData.company_info,
        interviewer_info: formData.interviewer_info,
        process_requirement: formData.process_requirement,
        constraint_info,
      });

      navigate(result.interviewer_url);
    } catch (error) {
      alert('创建面试失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card card-elevated" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>面试配置</h2>
      <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xl)' }}>
        配置面试参数，AI将根据这些信息自动生成面试问题
      </p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>基本信息</h3>
          
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
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>面试官设置</h3>
          
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label label-required">面试官信息</label>
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
              placeholder="面试官姓名、职位、性格特点、提问风格偏好等..."
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label label-required">流程要求</label>
              <button
                type="button"
                className="ai-optimize-button"
                onClick={() => handleOptimize('process', formData.process_requirement)}
                disabled={optimizeLoading.process}
                title="AI优化"
              >
                {optimizeLoading.process ? <span className="loading-spinner"></span> : '✨'}
              </button>
            </div>
            <textarea
              className="textarea"
              value={formData.process_requirement}
              onChange={(e) => setFormData({ ...formData, process_requirement: e.target.value })}
              placeholder="面试轮次、考察重点、时间分配、特殊要求等..."
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>约束参数</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="label">最大问题数</label>
              <input
                type="number"
                className="input"
                value={formData.max_questions}
                onChange={(e) => setFormData({ ...formData, max_questions: parseInt(e.target.value) || 10 })}
                min={1}
                max={50}
              />
            </div>
            <div className="form-group">
              <label className="label">最大时长（分钟）</label>
              <input
                type="number"
                className="input"
                value={formData.max_duration}
                onChange={(e) => setFormData({ ...formData, max_duration: parseInt(e.target.value) || 30 })}
                min={5}
                max={120}
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
              '开始面试'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}