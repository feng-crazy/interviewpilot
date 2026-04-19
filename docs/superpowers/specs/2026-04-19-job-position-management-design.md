# Job Position Management Feature Design

**Created**: 2026-04-19
**Status**: Approved
**Scope**: Complete Implementation (Database + API + Frontend + Prompts)

---

## Summary

InterviewPilot currently creates each interview as an independent session, requiring repeated input of job position information (JD, company info, interviewer info, process requirements). This design introduces a **JobPosition entity** that stores reusable job configuration, enabling users to:

1. Create and manage job position templates independently
2. Start multiple interviews from the same position template
3. Upload candidate resumes (PDF/DOCX) during interview creation
4. Inject resume information into LLM prompts for personalized questioning

---

## Architecture Overview

### Current vs New Data Model

**Current**:
- `Interview` table contains all job-related fields + session fields
- Each interview is created with full configuration input
- No resume support

**New**:
- `JobPosition` table stores reusable job configuration
- `Interview` references `JobPosition` via FK
- `Interview` stores per-session data: resume text, override parameters, session state
- Clear domain separation: Job Position Domain vs Interview Session Domain

---

## Data Model Design

### New Entity: JobPosition

```python
class JobPosition(Base):
    __tablename__ = "job_positions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)  # Position name, e.g., "高级后端工程师-平台组" or "产品经理-AI方向"
    
    # Job configuration fields (extracted from Interview)
    jd_text = Column(Text, nullable=False)
    company_info = Column(Text, nullable=False)
    interviewer_info = Column(Text, nullable=False)
    process_requirement = Column(Text, nullable=False)
    
    # Default constraints
    default_max_questions = Column(Integer, default=10)
    default_max_duration = Column(Integer, default=1800)  # seconds
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    interviews = relationship("Interview", back_populates="job_position")
```

### Modified Entity: Interview

**Fields removed** (moved to JobPosition):
- `jd_text`
- `company_info`
- `interviewer_info`
- `process_requirement`
- `constraint_info`

**Fields added**:
- `job_position_id` (FK, non-nullable)
- `resume_text` (Text, nullable)

**Fields retained** (session-specific):
- `id`, `max_questions`, `max_duration` (can override defaults)
- `interviewer_url`, `candidate_url`
- `status`, `ai_managed`, `started_at`, `ended_at`, `report_status`
- `created_at`, `updated_at`

### Relationships

```
JobPosition (1) ──< (N) Interview
Interview (1) ──< (N) ChatMessage
Interview (1) ── (1) InterviewReport
```

---

## API Design

### New Routes: JobPosition CRUD

**File**: `backend/app/api/routes/job_position.py`

| Method | Path | Function | Request | Response |
|--------|------|----------|---------|----------|
| POST | `/api/job-position/create` | Create position | `JobPositionCreateRequest` | `JobPositionResponse` |
| GET | `/api/job-position/list` | List positions | Query: `limit`, `offset` | `JobPositionListResponse` |
| GET | `/api/job-position/{id}` | Get detail | - | `JobPositionDetail` |
| PUT | `/api/job-position/{id}` | Update position | `JobPositionUpdateRequest` | `JobPositionResponse` |
| DELETE | `/api/job-position/{id}` | Delete position | - | `{"success": true}` |

### Modified Route: Interview Creation

**File**: `backend/app/api/routes/interview.py`

**POST `/create` Request Body**:
```python
class InterviewCreateRequest(BaseModel):
    job_position_id: str  # Required FK
    resume_text: Optional[str] = None  # Extracted from uploaded file
    max_questions: Optional[int] = None  # Override default
    max_duration: Optional[int] = None  # Override default (seconds)
```

**Logic**:
1. Fetch JobPosition by `job_position_id`
2. Create Interview with:
   - `job_position_id` from request
   - `resume_text` from request
   - `max_questions` = request override OR job_position.default_max_questions
   - `max_duration` = request override OR job_position.default_max_duration
   - Generate URLs as before

### New Service: Resume Parser

**File**: `backend/app/services/resume_parser.py`

**Dependencies**: `pdfplumber`, `python-docx`

**Function**:
```python
class ResumeParserService:
    async def extract_text(content: bytes, filename: str) -> str:
        """
        Extract text from PDF or DOCX resume.
        
        Args:
            content: Raw file bytes (from FastAPI UploadFile)
            filename: Original filename to detect format
            
        Returns:
            Plain text content for LLM injection
            
        Raises:
            ValueError: Unsupported format or extraction failure
        """
        ext = filename.lower().split('.')[-1]
        
        if ext == 'pdf':
            return self._extract_pdf(content)
        elif ext in ['docx', 'doc']:
            return self._extract_docx(content)
        else:
            raise ValueError(f"Unsupported format: {ext}")
```

**PDF Extraction** (pdfplumber):
```python
def _extract_pdf(content: bytes) -> str:
    text_parts = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(
                layout=True,  # Preserve layout for resumes
                x_tolerance=3,
                y_tolerance=3
            )
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)
```

**DOCX Extraction** (python-docx):
```python
def _extract_docx(content: bytes) -> str:
    doc = Document(BytesIO(content))
    text_parts = []
    
    for para in doc.paragraphs:
        if para.text.strip():
            text_parts.append(para.text)
    
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells)
            if row_text.strip():
                text_parts.append(row_text)
    
    return "\n\n".join(text_parts)
```

### New Route: Resume Upload

**File**: `backend/app/api/routes/resume.py`

| Method | Path | Function | Request | Response |
|--------|------|----------|---------|----------|
| POST | `/api/resume/parse` | Upload & parse resume | `UploadFile` (multipart) | `{"text": str}` |

**Usage**: Frontend uploads file, receives parsed text, then passes to `/create` interview endpoint.

---

## Frontend Design

### New Pages

| Page | Path | Purpose |
|------|------|---------|
| JobPositionListPage | `/positions` | Browse job position library, create new positions |
| JobPositionDetailPage | `/positions/:id` | View/edit position details, start interview from position |
| JobPositionCreatePage | `/positions/create` | Create new job position (form similar to ConfigPage) |

### Modified Pages

**HomePage**:
- Change "开始创建面试" button to "岗位库" (navigate to `/positions`)
- Add "新建岗位" button (navigate to `/positions/create`)
- **Note**: User selected "岗位库模式" - positions are created first, then interviews are started from positions. No "快速面试" (skip position library) option needed.

**InterviewerPage**:
- Add resume summary display in header section
- Click to expand full resume text

**DetailPage**:
- Add JobPosition info card showing position name and key fields

### Resume Upload Modal

**Trigger**: Click "开始面试" button in JobPositionDetailPage

**UI Components**:
1. **Tab Toggle**: "上传简历" / "手动输入"
2. **Upload Zone**: Drag-drop area for PDF/DOCX files
3. **Manual Input**: Textarea for direct resume text input
4. **Optional Settings**: Collapsible section with constraint overrides
5. **Actions**: "取消" (secondary), "确认开始" (primary)

**Flow**:
1. User clicks "开始面试"
2. Modal opens
3. User uploads file OR manually inputs text
4. File uploaded → call `/api/resume/parse` → receive text
5. User adjusts constraints (optional)
6. Click "确认开始" → call `/api/interview/create` with:
   - `job_position_id`
   - `resume_text` (parsed or manual)
   - Constraint overrides (if provided)
7. Navigate to InterviewerPage

---

## Prompt Template Design

### Modified: question_prompt.md

**Add section after "面试配置" and before "聊天历史"**:

```markdown
## 候选人简历

{resume_text}

**注意**：
- 如果简历为空或显示"未提供简历信息"，则根据JD要求自由提问
- 如果简历已提供，应结合简历内容针对性提问
- 可针对简历中的项目经历、技能列表、教育背景深入追问
- 问题应帮助验证简历信息的真实性
```

### PromptService Variable Mapping

**File**: `backend/app/services/prompt_service.py`

**Updated variable sources**:

| Variable | Source | Access Path |
|----------|--------|-------------|
| `{jd_text}` | JobPosition | `interview.job_position.jd_text` |
| `{company_info}` | JobPosition | `interview.job_position.company_info` |
| `{interviewer_info}` | JobPosition | `interview.job_position.interviewer_info` |
| `{process_requirement}` | JobPosition | `interview.job_position.process_requirement` |
| `{resume_text}` | Interview | `interview.resume_text` |

**chat.py Rendering Update**:
```python
variables = {
    "jd_text": interview.job_position.jd_text,
    "company_info": interview.job_position.company_info,
    "interviewer_info": interview.job_position.interviewer_info,
    "process_requirement": interview.job_position.process_requirement,
    "resume_text": interview.resume_text or "未提供简历信息",
    "max_questions": interview.max_questions,
    "current_question_count": current_question_count,
    "max_duration": interview.max_duration // 60,
    "elapsed_duration": elapsed_duration,
    "chat_history": format_chat_history(messages),
}
```

### Report Templates

**Files**: `backend/app/config/prompts/report/*.md`

**Change**: `{jd_text}` access path updated to `interview.job_position.jd_text`

---

## Implementation Plan

### Phase 1: Backend Foundation
1. Create JobPosition ORM model + Pydantic models
2. Create JobPosition CRUD API routes
3. Modify Interview ORM model (add FK, remove job fields, add resume_text)
4. Create ResumeParserService
3. Create resume upload API route
5. Modify interview creation route
6. Update database initialization

### Phase 2: Prompt Integration
1. Update question_prompt.md
2. Modify PromptService variable mapping
3. Update chat.py prompt rendering
4. Update report_service.py template rendering

### Phase 3: Frontend Pages
1. Create JobPositionListPage
2. Create JobPositionDetailPage
3. Create JobPositionCreatePage
4. Create ResumeUploadModal component
5. Update HomePage navigation
6. Update InterviewerPage resume display
7. Update DetailPage position info

### Phase 4: Integration Testing
1. Test position creation flow
2. Test resume parsing (PDF/DOCX)
3. Test interview creation from position
4. Test prompt injection with resume
5. Test end-to-end interview flow

---

## Data Migration

**Decision**: Delete all existing Interview records (user confirmed).

**Approach**:
- Drop existing database file: `backend/data/interviewpilot.db`
- Reinitialize database with new schema on first backend start
- No migration script needed

---

## Dependencies

**Add to backend requirements**:
```
pdfplumber>=0.11.0
python-docx>=1.1.0
```

---

## Files Changed Summary

### Backend - New Files
- `backend/app/database/job_position_model.py` (or in models.py)
- `backend/app/models/job_position.py` (Pydantic models)
- `backend/app/api/routes/job_position.py`
- `backend/app/api/routes/resume.py`
- `backend/app/services/resume_parser.py`

### Backend - Modified Files
- `backend/app/database/models.py` (Interview model changes)
- `backend/app/models/interview.py` (request/response models)
- `backend/app/api/routes/interview.py` (creation logic)
- `backend/app/api/routes/chat.py` (prompt rendering)
- `backend/app/services/prompt_service.py` (variable mapping)
- `backend/app/services/report_service.py` (template rendering)
- `backend/app/config/prompts/question_prompt.md` (add resume section)
- `backend/app/config/prompts/report/*.md` (variable access)
- `backend/app/main.py` (register new routes)

### Frontend - New Files
- `frontend/src/pages/JobPositionListPage.tsx`
- `frontend/src/pages/JobPositionDetailPage.tsx`
- `frontend/src/pages/JobPositionCreatePage.tsx`
- `frontend/src/components/ResumeUploadModal.tsx`
- `frontend/src/services/jobPositionApi.ts`

### Frontend - Modified Files
- `frontend/src/pages/HomePage.tsx` (navigation buttons: "岗位库" + "新建岗位")
- `frontend/src/pages/InterviewerPage.tsx` (resume display)
- `frontend/src/pages/DetailPage.tsx` (position info card)
- `frontend/src/router.tsx` (add new routes)
- `frontend/src/services/api.ts` (add API functions)
- `frontend/src/types/interview.ts` (add JobPosition types)

---

## Success Criteria

1. User can create a JobPosition with all required fields
2. User can list, view, edit, delete JobPositions
3. User can start an interview from a JobPosition
4. User can upload PDF/DOCX resume and text is extracted
5. Interview questions incorporate resume information
6. Multiple interviews can be created from same JobPosition
7. All existing functionality (chat, WebSocket, report) works unchanged