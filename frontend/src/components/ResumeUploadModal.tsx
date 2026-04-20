import { useState, useRef, useCallback } from 'react';
import type { InterviewCreateRequest, InterviewResponse, ResumeParseResponse } from '../types/interview';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobPositionId: string;
  onStartInterview: (interviewId: string) => void;
}

type TabType = 'upload' | 'manual';

const parseResume = async (file: File): Promise<ResumeParseResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/parse-resume', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to parse resume');
  }

  return response.json();
};

const createInterview = async (data: InterviewCreateRequest): Promise<InterviewResponse> => {
  const response = await fetch('/api/interview/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create interview');
  }

  return response.json();
};

export default function ResumeUploadModal({
  isOpen,
  onClose,
  jobPositionId,
  onStartInterview,
}: ResumeUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [resumeText, setResumeText] = useState('');
  const [maxQuestionsOverride, setMaxQuestionsOverride] = useState<number | undefined>(undefined);
  const [maxDurationOverride, setMaxDurationOverride] = useState<number | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setUploadError('请上传 PDF 或 DOCX 格式的文件');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await parseResume(file);
      setResumeText(result.text);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '文件解析失败');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleStartInterview = useCallback(async () => {
    if (!resumeText.trim()) {
      setCreateError('请先上传简历或输入简历内容');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const requestData: InterviewCreateRequest = {
        job_position_id: jobPositionId,
        resume_text: resumeText,
        ...(maxQuestionsOverride !== undefined && { max_questions: maxQuestionsOverride }),
        ...(maxDurationOverride !== undefined && { max_duration: maxDurationOverride }),
      };

      const result = await createInterview(requestData);
      onStartInterview(result.interview_id);
      onClose();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '创建面试失败');
    } finally {
      setIsCreating(false);
    }
  }, [resumeText, jobPositionId, maxQuestionsOverride, maxDurationOverride, onStartInterview, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setUploadError(null);
    setCreateError(null);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="resume-modal-title" className="modal-title">
            开始面试
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="tab-list" role="tablist">
            <button
              className="tab-button"
              role="tab"
              aria-selected={activeTab === 'upload'}
              onClick={() => handleTabChange('upload')}
            >
              上传简历
            </button>
            <button
              className="tab-button"
              role="tab"
              aria-selected={activeTab === 'manual'}
              onClick={() => handleTabChange('manual')}
            >
              手动输入
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="tab-panel" role="tabpanel">
              <div
                className={`upload-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-zone-content">
                  {isUploading ? (
                    <>
                      <div className="loading-spinner" />
                      <span className="upload-text">正在解析简历...</span>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon">📄</div>
                      <span className="upload-text">
                        拖拽文件到此处，或点击上传
                      </span>
                      <span className="upload-hint">
                        支持 PDF、DOCX 格式
                      </span>
                    </>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="error-message" role="alert">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="tab-panel" role="tabpanel">
              <div className="form-group">
                <label className="label" htmlFor="resume-text">
                  简历内容
                </label>
                <textarea
                  id="resume-text"
                  className="textarea resume-textarea"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="请在此粘贴简历内容..."
                  rows={10}
                />
              </div>
            </div>
          )}

          {resumeText && (
            <div className="resume-preview">
              <h3 className="preview-title">简历预览</h3>
              <div className="preview-content">
                {resumeText.slice(0, 500)}
                {resumeText.length > 500 && '...'}
              </div>
            </div>
          )}

          <div className="settings-section">
            <button
              className="settings-toggle"
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              aria-expanded={isSettingsExpanded}
            >
              <span>高级设置</span>
              <span className={`settings-arrow ${isSettingsExpanded ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>

            {isSettingsExpanded && (
              <div className="settings-content">
                <div className="form-row">
                  <div className="form-group">
                    <label className="label" htmlFor="max-questions">
                      最大问题数
                    </label>
                    <input
                      id="max-questions"
                      type="number"
                      className="input"
                      value={maxQuestionsOverride ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMaxQuestionsOverride(value ? parseInt(value, 10) : undefined);
                      }}
                      placeholder="使用默认值"
                      min={1}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label" htmlFor="max-duration">
                      最大时长（秒）
                    </label>
                    <input
                      id="max-duration"
                      type="number"
                      className="input"
                      value={maxDurationOverride ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMaxDurationOverride(value ? parseInt(value, 10) : undefined);
                      }}
                      placeholder="使用默认值"
                      min={60}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {createError && (
            <div className="error-message" role="alert">
              {createError}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="button button-secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            取消
          </button>
          <button
            className="button"
            onClick={handleStartInterview}
            disabled={isCreating || !resumeText.trim()}
          >
            {isCreating ? (
              <>
                <div className="loading-spinner" />
                创建中...
              </>
            ) : (
              '确认开始'
            )}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-md);
          animation: fadeIn 200ms ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: slideIn 200ms ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-gray-200);
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: var(--color-gray-500);
          cursor: pointer;
          padding: var(--spacing-xs);
          line-height: 1;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .modal-close:hover {
          background: var(--color-gray-100);
          color: var(--color-gray-900);
        }

        .modal-body {
          padding: var(--spacing-lg);
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          border-top: 1px solid var(--color-gray-200);
        }

        .upload-zone {
          border: 2px dashed var(--color-gray-300);
          border-radius: var(--radius-lg);
          padding: var(--spacing-2xl);
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          background: var(--color-gray-50);
        }

        .upload-zone:hover {
          border-color: var(--color-primary-400);
          background: var(--color-primary-50);
        }

        .upload-zone.dragging {
          border-color: var(--color-primary-500);
          background: var(--color-primary-100);
        }

        .upload-zone.uploading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .upload-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }

        .upload-icon {
          font-size: 2.5rem;
          opacity: 0.6;
        }

        .upload-text {
          font-size: 1rem;
          color: var(--color-gray-700);
          font-weight: 500;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: var(--color-gray-500);
        }

        .resume-textarea {
          min-height: 200px;
          font-family: inherit;
        }

        .resume-preview {
          margin-top: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-gray-200);
        }

        .preview-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-gray-700);
          margin-bottom: var(--spacing-sm);
        }

        .preview-content {
          font-size: 0.875rem;
          color: var(--color-gray-600);
          line-height: 1.6;
          max-height: 150px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .settings-section {
          margin-top: var(--spacing-lg);
        }

        .settings-toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) 0;
          background: transparent;
          border: none;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-gray-600);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .settings-toggle:hover {
          color: var(--color-gray-900);
        }

        .settings-arrow {
          transition: transform var(--transition-fast);
          font-size: 0.75rem;
        }

        .settings-arrow.expanded {
          transform: rotate(180deg);
        }

        .settings-content {
          padding-top: var(--spacing-md);
          animation: expandIn 200ms ease;
        }

        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-message {
          margin-top: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-error-50);
          border: 1px solid var(--color-error-200);
          border-radius: var(--radius-md);
          color: var(--color-error-600);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .modal-content {
            max-height: 95vh;
            margin: var(--spacing-sm);
          }

          .modal-body {
            padding: var(--spacing-md);
          }

          .upload-zone {
            padding: var(--spacing-xl);
          }
        }
      `}</style>
    </div>
  );
}
