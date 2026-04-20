from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict

from ...services.llm_service import LLMService
from ...services.prompt_service import prompt_service

router = APIRouter()
llm_service = LLMService()


class OptimizeRequest(BaseModel):
    field_type: str  # "jd" | "company" | "interviewer" | "process"
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
        "process": "interview_scheme",
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
    valid_types = ["jd", "company", "interviewer", "process"]
    if request.field_type not in valid_types:
        raise HTTPException(
            status_code=400, detail=f"Invalid field_type: {request.field_type}"
        )

    # 渲染提示词（render_template会自动加载模板）
    template_name = f"optimization/{request.field_type}_optimization"
    context_summary = build_context_summary(request.context, request.field_type)
    task_instruction = (
        "优化现有内容，使其更适合做AI面试的输入信息"
        if request.field_content.strip()
        else "根据上下文信息生成合理的默认内容"
    )

    prompt = prompt_service.render_template(
        template_name,
        {
            "field_content": request.field_content or "(空)",
            "context_summary": context_summary,
            "task_instruction": task_instruction,
        },
    )

    # 调用LLM
    try:
        optimized_content = await llm_service.generate(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

    # 返回结果
    return OptimizeResponse(optimized_content=optimized_content)
