import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/api';

export default function ConfigPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    jd_text: '',
    company_info: '',
    interviewer_info: '',
    process_requirement: '',
    max_questions: 10,
    max_duration: 30,
  });

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
    <div className="card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <h2>面试配置</h2>
      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label>岗位 JD *</label>
          <textarea
            className="textarea"
            value={formData.jd_text}
            onChange={(e) => setFormData({ ...formData, jd_text: e.target.value })}
            placeholder="请输入岗位描述、技能要求..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>公司信息 *</label>
          <textarea
            className="textarea"
            value={formData.company_info}
            onChange={(e) => setFormData({ ...formData, company_info: e.target.value })}
            placeholder="公司名称、行业、业务简介..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>面试官信息 *</label>
          <textarea
            className="textarea"
            value={formData.interviewer_info}
            onChange={(e) => setFormData({ ...formData, interviewer_info: e.target.value })}
            placeholder="面试官姓名、职位...、性格特点...、喜好..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>流程要求 *</label>
          <textarea
            className="textarea"
            value={formData.process_requirement}
            onChange={(e) => setFormData({ ...formData, process_requirement: e.target.value })}
            placeholder="面试轮次、考察重点..."
            required
          />
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label>最大问题数</label>
            <input
              type="number"
              className="input"
              value={formData.max_questions}
              onChange={(e) => setFormData({ ...formData, max_questions: parseInt(e.target.value) })}
              min={1}
              max={50}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>最大时长（分钟）</label>
            <input
              type="number"
              className="input"
              value={formData.max_duration}
              onChange={(e) => setFormData({ ...formData, max_duration: parseInt(e.target.value) })}
              min={5}
              max={120}
            />
          </div>
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? '正在创建...' : '开始面试'}
        </button>
      </form>
    </div>
  );
}