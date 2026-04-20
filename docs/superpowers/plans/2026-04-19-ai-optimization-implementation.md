# AI优化配置项功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为配置页面的4个文本配置项添加AI优化按钮，点击后智能优化或生成内容。

**Architecture:** 后端新增优化API路由 + 4个Markdown提示词模板，前端添加魔法棒按钮和状态管理，复用现有LLMService和PromptService。

**Tech Stack:** FastAPI, Pydantic v2, React 18, Axios, DashScope LLM API

---

## 文件结构

**创建文件：**
- `backend/app/config/prompts/optimization/jd_optimization.md` - JD优化提示词
- `backend/app/config/prompts/optimization/company_optimization.md` - 公司信息优化提示词
- `backend/app/config/prompts/optimization/interviewer_optimization.md` - 面试偏好信息优化提示词
- `backend/app/config/prompts/optimization/scheme_optimization.md` - 面试方案优化提示词
- `backend/app/api/routes/optimize.py` - 优化API路由

**修改文件：**
- `backend/app/main.py` - 注册优化路由
- `frontend/src/services/api.ts` - 添加optimizeContent()函数
- `frontend/src/pages/JobPositionCreatePage.tsx` - 添加AI优化按钮和状态
- `frontend/src/index.css` - 添加.ai-optimize-button样式

---

### Task 1: 创建JD优化提示词模板

**Files:**
- Create: `backend/app/config/prompts/optimization/jd_optimization.md`

- [ ] **Step 1: 创建optimization目录**

```bash
mkdir -p backend/app/config/prompts/optimization
```

- [ ] **Step 2: 编写jd_optimization.md提示词**

```markdown
你是一个专业的招聘顾问。请帮助用户优化岗位JD内容。

## 当前JD内容
{field_content}

## 相关上下文
{context_summary}

## 任务
{task_instruction}

## 输出要求
1. 突出核心技能要求和岗位职责
2. 补充遗漏的关键信息（如学历、经验年限、团队规模等）
3. 使用专业、清晰的语言表达
4. 保持原有格式风格（如果有）
5. 仅输出优化后的JD内容，不要添加任何解释

## 注意
- 如果JD已有内容，进行润色和补充而非完全重写
- 如果JD为空，根据上下文中的公司信息和面试方案推测生成
- 避免过于技术化或过于泛泛的表述
```

- [ ] **Step 3: 提交**

```bash
git add backend/app/config/prompts/optimization/jd_optimization.md
git commit -m "feat: add JD optimization prompt template"
```

---

### Task 2: 创建公司信息优化提示词模板

**Files:**
- Create: `backend/app/config/prompts/optimization/company_optimization.md`

- [ ] **Step 1: 编写company_optimization.md提示词**

```markdown
你是一个企业品牌专家。请帮助用户优化公司信息内容。

## 当前公司信息
{field_content}

## 相关上下文
{context_summary}

## 任务
{task_instruction}

## 输出要求
1. 突出公司核心业务和行业定位
2. 补充企业文化、团队氛围等软性信息
3. 使用简洁有力的语言
4. 仅输出优化后的公司信息，不要添加任何解释

## 注意
- 如果内容已有，进行精炼和补充
- 如果内容为空，根据JD推测公司可能的技术栈和业务领域
- 强调吸引候选人的亮点
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/config/prompts/optimization/company_optimization.md
git commit -m "feat: add company info optimization prompt template"
```

---

### Task 3: 创建面试偏好信息优化提示词模板

**Files:**
- Create: `backend/app/config/prompts/optimization/interviewer_optimization.md`

- [ ] **Step 1: 编写interviewer_optimization.md提示词**

```markdown
你是一个面试风格专家。请帮助用户优化面试偏好信息内容。

## 当前面试偏好信息
{field_content}

## 相关上下文
{context_summary}

## 任务
{task_instruction}

## 输出要求
1. 明确面试官职位、背景和专业领域
2. 描述提问风格（如追问深度、亲和程度、技术倾向）
3. 补充性格特点或面试偏好
4. 仅输出优化后的面试偏好信息，不要添加任何解释

## 注意
- 如果内容已有，进行补充和精炼
- 如果内容为空，根据JD推测合适的面试官类型（如技术专家、部门主管等）
- 保持真实可信，避免过于理想化
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/config/prompts/optimization/interviewer_optimization.md
git commit -m "feat: add interviewer info optimization prompt template"
```

---

### Task 4: 创建面试方案优化提示词模板

**Files:**
- Create: `backend/app/config/prompts/optimization/scheme_optimization.md`

- [ ] **Step 1: 编写scheme_optimization.md提示词**

```markdown
你是一个面试流程设计专家。请帮助用户优化面试面试方案内容。

## 当前面试方案
{field_content}

## 相关上下文
{context_summary}

## 任务
{task_instruction}

## 输出要求
1. 明确考察重点和评估维度
2. 规划提问顺序和时间分配
3. 补充特殊要求（如开场、结束语、深挖方向）
4. 仅输出优化后的面试方案，不要添加任何解释

## 注意
- 如果内容已有，进行结构化和补充
- 如果内容为空，根据JD和公司信息推测考察重点
- 保持可操作性，便于AI面试官执行
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/config/prompts/optimization/scheme_optimization.md
git commit -m "feat: add scheme optimization prompt template"
```

---

### Task 5: 创建优化API路由

**Files:**
- Create: `backend/app/api/routes/optimize.py`

- [ ] **Step 1: 编写optimize.py完整代码**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict

from ...services.llm_service import LLMService
from ...services.prompt_service import prompt_service

router = APIRouter()
llm_service = LLMService()


class OptimizeRequest(BaseModel):
    field_type: str  # "jd" | "company" | "interviewer" | "scheme"
    field_content: str  # 当前textarea内容（可能为空）
    context: Dict[str, str]  # 其他已填字段


class OptimizeResponse(BaseModel):
    optimized_content: str  # AI生成的优化内容


def build_context_summary(context: Dict[str, str], field_type: str) -> str:
    """构建上下文摘要，排除当前字段"""
    field_labels = {
        "jd_text": "岗位JD",
        "company_info": "公司信息",
        "interviewer_info": "面试偏好信息",
        "interview_scheme": "面试方案",
    }
    
    # 排除当前字段对应的context key
    field_to_context_key = {
        "jd": "jd_text",
        "company": "company_info",
        "interviewer": "interviewer_info",
        "scheme": "interview_scheme",
    }
    
    exclude_key = field_to_context_key.get(field_type)
    
    summary_lines = []
    for key, value in context.items():
        if key != exclude_key and value and value.strip():
            label = field_labels.get(key, key)
            summary_lines.append(f"{label}: {value}")
    
    return "\n\n".join(summary_lines) if summary_lines else "无相关上下文信息"


@router.post("/api/optimize", response_model=OptimizeResponse)
async def optimize_field(request: OptimizeRequest):
    """优化配置项内容"""
    # 验证field_type
    valid_types = ["jd", "company", "interviewer", "scheme"]
    if request.field_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid field_type: {request.field_type}")
    
    # 加载对应提示词模板
    template_name = f"optimization/{request.field_type}_optimization"
    
    try:
        prompt_template = prompt_service.load_template(template_name)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"Prompt template not found: {template_name}")
    
    # 构建上下文摘要
    context_summary = build_context_summary(request.context, request.field_type)
    
    # 动态任务指令
    task_instruction = (
        "优化现有内容，使其更专业完整"
        if request.field_content.strip()
        else "根据上下文信息生成合理的默认内容"
    )
    
    # 渲染提示词
    prompt = prompt_service.render_template(template_name, {
        "field_content": request.field_content or "(空)",
        "context_summary": context_summary,
        "task_instruction": task_instruction,
    })
    
    # 调用LLM
    try:
        optimized_content = await llm_service.generate(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")
    
    # 返回结果
    return OptimizeResponse(optimized_content=optimized_content)
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/api/routes/optimize.py
git commit -m "feat: add optimize API route with LLM integration"
```

---

### Task 6: 注册优化路由到main.py

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: 添加optimize router导入**

在文件顶部导入部分添加：
```python
from .api.routes.optimize import router as optimize_router
```

完整导入部分应为：
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db
from .api.routes.interview import router as interview_router
from .api.routes.chat import router as chat_router
from .api.routes.control import router as control_router
from .api.routes.websocket import router as websocket_router
from .api.routes.report import router as report_router
from .api.routes.speech import router as speech_router
from .api.routes.optimize import router as optimize_router
```

- [ ] **Step 2: 注册optimize router**

在router注册部分添加：
```python
app.include_router(optimize_router, tags=["optimize"])
```

完整router注册部分应为：
```python
app.include_router(interview_router, prefix="/api/interview", tags=["interview"])
app.include_router(chat_router, tags=["chat"])
app.include_router(control_router, tags=["control"])
app.include_router(websocket_router, tags=["websocket"])
app.include_router(report_router, tags=["report"])
app.include_router(speech_router, tags=["speech"])
app.include_router(optimize_router, tags=["optimize"])
```

- [ ] **Step 3: 提交**

```bash
git add backend/app/main.py
git commit -m "feat: register optimize router in FastAPI app"
```

---

### Task 7: 添加前端API服务函数

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: 添加optimizeContent函数**

在文件末尾添加：
```typescript
export const optimizeContent = async (
  fieldType: string,
  fieldContent: string,
  context: Record<string, string>
) => {
  const response = await api.post('/optimize', {
    field_type: fieldType,
    field_content: fieldContent,
    context,
  });
  return response.data;
};
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add optimizeContent API function"
```

---

### Task 8: 添加AI优化按钮CSS样式

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: 在文件末尾添加.ai-optimize-button样式**

```css
.ai-optimize-button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-optimize-button:hover {
  opacity: 1;
}

.ai-optimize-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-optimize-button .loading-spinner {
  width: 1rem;
  height: 1rem;
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/index.css
git commit -m "feat: add AI optimize button styles"
```

---

### Task 9: 修改JobPositionCreatePage添加AI优化功能

**Files:**
- Modify: `frontend/src/pages/JobPositionCreatePage.tsx`

- [ ] **Step 1: 导入optimizeContent**

修改导入部分：
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview, optimizeContent } from '../services/api';
```

- [ ] **Step 2: 添加optimizeLoading状态**

在 `const [loading, setLoading]` 之后添加：
```typescript
const [optimizeLoading, setOptimizeLoading] = useState({
  jd: false,
  company: false,
  interviewer: false,
  scheme: false,
});
```

- [ ] **Step 3: 添加buildContext辅助函数**

在 `handleSubmit` 函数之前添加：
```typescript
function buildContext(fieldType: string, formData: typeof formData) {
  const contextFields: Record<string, string[]> = {
    jd: ['company_info', 'interviewer_info', 'interview_scheme'],
    company: ['jd_text', 'interviewer_info', 'interview_scheme'],
    interviewer: ['jd_text', 'company_info', 'interview_scheme'],
    scheme: ['jd_text', 'company_info', 'interviewer_info'],
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
```

- [ ] **Step 4: 添加handleOptimize处理函数**

在 `buildContext` 函数之后添加：
```typescript
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
```

- [ ] **Step 5: 修改岗位JD表单项添加AI优化按钮**

```tsx
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
```

- [ ] **Step 6: 修改公司信息表单项添加AI优化按钮**

```tsx
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
```

- [ ] **Step 7: 修改面试偏好信息表单项添加AI优化按钮**

```tsx
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
    required
  />
</div>
```

- [ ] **Step 8: 修改面试方案表单项添加AI优化按钮**

```tsx
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
    placeholder="面试轮次、考察重点、时间分配、特殊要求等..."
    required
  />
</div>
```

- [ ] **Step 9: 提交**

```bash
git add frontend/src/pages/JobPositionCreatePage.tsx
git commit -m "feat: add AI optimize buttons to config page textareas"
```

---

### Task 10: 启动服务验证功能

- [ ] **Step 1: 启动后端服务**

```bash
cd backend && uvicorn app.main:app --reload --port 8000
```

验证：控制台显示 `Application startup complete`

- [ ] **Step 2: 启动前端服务**

```bash
cd frontend && npm run dev
```

验证：控制台显示 `Local: http://localhost:5173/`

- [ ] **Step 3: 手动测试AI优化功能**

1. 打开浏览器访问 http://localhost:5173
2. 进入配置页面
3. 在"岗位JD"输入框输入一些内容（如"前端开发工程师"）
4. 点击右上角的✨按钮
5. 观察加载状态（spinner显示）
6. 等待优化完成后，textarea内容被替换
7. 尝试其他三个配置项的优化按钮

验证标准：
- 点击按钮后显示加载spinner
- 优化完成后textarea内容更新
- 每个配置项独立工作，不影响其他字段
- 原有表单提交功能正常

---

## 验收清单

- [ ] 后端优化API路由可访问 (`POST /api/optimize`)
- [ ] 4个提示词模板文件存在
- [ ] 前端4个textarea右上角显示✨按钮
- [ ] 点击按钮触发加载状态
- [ ] 优化结果填充到对应textarea
- [ ] 每个字段独立优化，互不干扰
- [ ] 原有创建面试功能不受影响