from io import BytesIO
import pdfplumber
from docx import Document


class ResumeParserService:
    """Service for extracting text from PDF and DOCX resume files."""

    async def extract_text(self, content: bytes, filename: str) -> str:
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
        ext = filename.lower().split(".")[-1]

        if ext == "pdf":
            return self._extract_pdf(content)
        elif ext in ["docx", "doc"]:
            return self._extract_docx(content)
        else:
            raise ValueError(f"Unsupported format: {ext}")

    def _extract_pdf(self, content: bytes) -> str:
        """
        Extract text from PDF using pdfplumber.

        Args:
            content: Raw PDF file bytes

        Returns:
            Extracted text with preserved layout

        Raises:
            ValueError: If PDF extraction fails
        """
        text_parts = []
        try:
            with pdfplumber.open(BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text(
                        layout=True,  # Preserve layout for resumes
                        x_tolerance=3,
                        y_tolerance=3,
                    )
                    if page_text:
                        text_parts.append(page_text)
        except Exception as e:
            raise ValueError(f"PDF extraction failed: {str(e)}")

        return "\n\n".join(text_parts)

    def _extract_docx(self, content: bytes) -> str:
        """
        Extract text from DOCX using python-docx.

        Args:
            content: Raw DOCX file bytes

        Returns:
            Extracted text from paragraphs and tables

        Raises:
            ValueError: If DOCX extraction fails
        """
        text_parts = []
        try:
            doc = Document(BytesIO(content))

            for para in doc.paragraphs:
                if para.text.strip():
                    text_parts.append(para.text)

            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells)
                    if row_text.strip():
                        text_parts.append(row_text)
        except Exception as e:
            raise ValueError(f"DOCX extraction failed: {str(e)}")

        return "\n\n".join(text_parts)
