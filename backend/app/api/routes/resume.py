from fastapi import APIRouter, HTTPException, UploadFile, File

from ...services.resume_parser import ResumeParserService

router = APIRouter()
resume_parser = ResumeParserService()


@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """
    Upload and parse a resume file (PDF or DOCX).

    Args:
        file: Uploaded resume file

    Returns:
        {"text": extracted_text}

    Raises:
        HTTPException(400): Unsupported file format
        HTTPException(500): Extraction failure
    """
    try:
        content = await file.read()
        text = await resume_parser.extract_text(content, file.filename or "")
        return {"text": text}
    except ValueError as e:
        if "Unsupported format" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        else:
            raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")
