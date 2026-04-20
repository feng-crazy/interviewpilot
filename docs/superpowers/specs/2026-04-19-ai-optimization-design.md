# AI优化配置项功能设计

**Created:** 2026-04-19
**Status:** Draft

## 概述

为岗位配置页面的4个文本配置项（岗位JD、公司信息、面试官信息、流程要求）添加AI优化功能。每个配置项旁边显示一个魔法棒按钮（✨），点击后AI智能判断：如果输入框有内容则优化润色，如果为空则根据其他已填信息生成建议内容。

## 目标

- 提升用户配置效率，减少手动填写负担
- 利用AI智能补充遗漏信息，提升配置质量
- 保持用户控制权，优化结果直接填充到输入框供用户修改

## 架构设计

### 后端

**新增目录结构：**
```
backend/app/config/prompts/optimization/
├── jd_optimization.md          # JD优化提示词
├── company_optimization.md     # 公司信息优化提示词
├── interviewer_optimization.md # 面试官信息优化提示词
└── process_optimization.md     # 流程要求优化提示词
```

**新增API路由：**
- 文件：`backend/app/api/routes/optimize.py`
- 路径：`POST /api/optimize`
- 复用：`LLMService.generate()`（非流式调用）

### 前端

**修改文件：**
- `frontend/src/pages/JobPositionCreatePage.tsx` - 添加AI优化按钮和状态管理
- `frontend/src/services/api.ts` - 新增`optimizeContent()`API调用函数

**新增样式类：**
- `.ai-optimize-button` - 魔法棒按钮样式

### 数据流

```
用户点击✨按钮
→ 前端调用 POST /api/optimize {field_type, field_content, context}
→ 后端加载对应提示词模板
→ 构建上下文摘要（其他已填字段）
→ 渲染提示词（智能判断任务：优化或生成）
→ 调用 LLMService.generate()
→ 返回优化内容
→ 前端填充到textarea
```

## 提示词设计

### 通用模板结构

每个提示词模板包含：
- **当前字段内容**：`{field_content}`（空或有值）
- **相关上下文**：`{context_summary}`（其他已填字段摘要）
- **任务指令**：`{task_instruction}`（动态生成）
- **输出要求**：具体优化/生成规则
- **注意事项**：边界情况处理

### 动态任务指令

```python
if field_content.strip():
    task_instruction = "优化现有内容，使其更专业完整"
else:
    task_instruction = "根据上下文信息生成合理的默认内容"
```

### 四个提示词模板

#### 1. jd_optimization.md

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
- 如果JD为空，根据上下文中的公司信息和流程要求推测生成
- 避免过于技术化或过于泛泛的表述
```

#### 2. company_optimization.md

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

#### 3. interviewer_optimization.md

```markdown
你是一个面试风格专家。请帮助用户优化面试官信息内容。

## 当前面试官信息
{field_content}

## 相关上下文
{context_summary}

## 任务
{task_instruction}

## 输出要求
1. 明确面试官职位、背景和专业领域
2. 描述提问风格（如追问深度、亲和程度、技术倾向）
3. 补充性格特点或面试偏好
4. 仅输出优化后的面试官信息，不要添加任何解释

## 注意
- 如果内容已有，进行补充和精炼
- 如果内容为空，根据JD推测合适的面试官类型（如技术专家、部门主管等）
- 保持真实可信，避免过于理想化
```

#### 4. process_optimization.md

```markdown
你是一个面试流程设计专家。请帮助用户优化面试流程要求内容。

## 当前流程要求
{field_content}

## 相关上下文
{context_summary}

## 任务
{task_instruction}

## 输出要求
1. 明确考察重点和评估维度
2. 规划提问顺序和时间分配
3. 补充特殊要求（如开场、结束语、深挖方向）
4. 仅输出优化后的流程要求，不要添加任何解释

## 注意
- 如果内容已有，进行结构化和补充
- 如果内容为空，根据JD和公司信息推测考察重点
- 保持可操作性，便于AI面试官执行
```

## API设计

### Request Model

```python
class OptimizeRequest(BaseModel):
    field_type: str  # "jd" | "company" | "interviewer" | "process"
    field_content: str  # 当前textarea内容（可能为空）
    context: dict  # 其他已填字段 {jd_text, company_info, interviewer_info, process_requirement}
```

### Response Model

```python
class OptimizeResponse(BaseModel):
    optimized_content: str  # AI生成的优化内容
```

### 路由实现逻辑

```python
@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_field(request: OptimizeRequest):
    # 1. 加载对应提示词模板
    prompt_template = load_prompt(f"optimization/{request.field_type}_optimization.md")
    
    # 2. 构建上下文摘要（排除当前字段）
    context_summary = build_context_summary(request.context, request.field_type)
    
    # 3. 动态任务指令
    task_instruction = (
        "优化现有内容，使其更专业完整" 
        if request.field_content.strip() 
        else "根据上下文信息生成合理的默认内容"
    )
    
    # 4. 渲染提示词
    prompt = prompt_template.format(
        field_content=request.field_content,
        context_summary=context_summary,
        task_instruction=task_instruction
    )
    
    # 5. 调用LLM
    optimized_content = await llm_service.generate(prompt)
    
    # 6. 返回结果
    return OptimizeResponse(optimized_content=optimized_content)
```

## 前端组件设计

### 新增状态

```tsx
const [optimizeLoading, setOptimizeLoading] = useState({
  jd: false,
  company: false,
  interviewer: false,
  process: false
});
```

### 新增处理函数

```tsx
async function handleOptimize(fieldType: string, currentContent: string) {
  setOptimizeLoading({...optimizeLoading, [fieldType]: true});
  
  try {
    const context = buildContext(fieldType, formData);  // 排除当前字段
    const result = await optimizeContent(fieldType, currentContent, context);
    
    // 映射fieldType到formData字段名
    const fieldNameMap = {
      jd: 'jd_text',
      company: 'company_info',
      interviewer: 'interviewer_info',
      process: 'process_requirement'
    };
    
    setFormData({...formData, [fieldNameMap[fieldType]]: result.optimized_content});
  } catch (error) {
    console.error('优化失败:', error);
    // 可选：显示错误提示
  } finally {
    setOptimizeLoading({...optimizeLoading, [fieldType]: false});
  }
}

function buildContext(fieldType: string, formData: FormData) {
  const contextFields = {
    jd: ['company_info', 'interviewer_info', 'process_requirement'],
    company: ['jd_text', 'interviewer_info', 'process_requirement'],
    interviewer: ['jd_text', 'company_info', 'process_requirement'],
    process: ['jd_text', 'company_info', 'interviewer_info']
  };
  
  const context = {};
  for (const field of contextFields[fieldType]) {
    if (formData[field]?.trim()) {
      context[field] = formData[field];
    }
  }
  return context;
}
```

### 按钮布局

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

### 按钮样式

```css
.ai-optimize-button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.2s;
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

## 实现范围

### 包含

- 4个提示词模板文件（Markdown）
- 1个新API路由（`/api/optimize`）
- 前端4个AI优化按钮（仅textarea字段）
- 按钮加载状态和错误处理
- 智能判断逻辑（空→生成，有内容→优化）

### 不包含

- 约束参数（最大问题数、最大时长）的AI优化按钮
- 流式响应（使用非流式API）
- 用户历史配置记忆
- 多轮优化对话

## 技术约束

- 复用现有`LLMService.generate()`方法
- 复用现有`PromptService`模板渲染机制（如有）
- 遵循现有API路由模式（无版本号）
- 遵循现有前端状态管理模式（组件级hooks）

## 错误处理

- API调用失败：前端catch错误，console记录，不阻塞页面
- LLM返回空：保持textarea原值不变
- 网络超时：使用现有LLM_TIMEOUT配置

## 成功标准

- 点击按钮后，textarea内容被AI生成/优化的文本替换
- 加载状态清晰可见（spinner替代魔法棒图标）
- 用户可继续编辑优化后的内容
- 不影响原有表单提交流程