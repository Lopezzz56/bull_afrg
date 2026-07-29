import os
import shutil

from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response, HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

# ── Resolve absolute paths relative to this file so uvicorn can be run from any cwd ──
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
DUMMY_REPORT_PATH = BACKEND_DIR / "dummy_report.json"
MOCK_PDF_PATH = PROJECT_ROOT / "ICICI Q2FY26.pdf"

from backend.app.core.config import settings
from backend.app.schemas import ReportData, ExtractionResponse
from backend.app.services.extractor import extract_financial_data_async
from backend.app.services.validator import validate_math_consistency
from backend.app.services.charts import generate_all_charts
from backend.app.services.pdf_generator import compile_template, render_pdf

app = FastAPI(title="FinReport AI Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)






class RenderRequest(BaseModel):
    data: dict

@app.get("/api/mock-pdf")
async def get_mock_pdf():
    if MOCK_PDF_PATH.exists():
        return FileResponse(str(MOCK_PDF_PATH), media_type="application/pdf")
    raise HTTPException(status_code=404, detail="Mock PDF not found at expected path.")

@app.post("/api/extract", response_model=ExtractionResponse)
async def api_extract(file: UploadFile = File(...)):
    """
    Pipeline: PDF parse → Gemini/OpenRouter extraction → bbox resolution → math validation.
    Returns ExtractionResponse with data, citations, and validation_flags.
    """
    file_ext = os.path.splitext(file.filename or '')[1].lower()
    if file_ext not in [".pdf", ".txt", ".csv"]:
        raise HTTPException(status_code=400, detail="Unsupported format. Upload PDF, CSV, or TXT.")

    temp_file_path = os.path.join(settings.TEMP_DIR, file.filename)
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if file_ext == ".pdf":
            extraction = await extract_financial_data_async(temp_file_path)
        else:
            import json as _json
            with open(str(DUMMY_REPORT_PATH), "r", encoding="utf-8") as df:
                extraction = _json.load(df)

        data = extraction.get("data", {})
        citations = extraction.get("citations", {})

        # Server-side math validation (YoY / QoQ / margin checks)
        validation_flags = validate_math_consistency(data)

        report_obj = ReportData(**data)

        return ExtractionResponse(
            data=report_obj,
            citations=citations,
            validation_flags=validation_flags,
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass


@app.post("/api/preview-html", response_class=HTMLResponse)
async def api_preview_html(req: RenderRequest):
    """
    Receives current editor state, updates charts dynamically, compiles the HTML report template,
    and returns the compiled HTML for the live iframe preview.
    """
    try:
        data = req.data
        chart_urls = generate_all_charts(data)
        
        if "charts" not in data:
            data["charts"] = {}
        data["charts"].update(chart_urls)
        
        html_content = compile_template(data)
        return html_content
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")


@app.post("/api/generate-pdf")
async def api_generate_pdf(req: RenderRequest):
    """
    Compiles the report with updated data and charts, renders it to an A4 PDF using Playwright,
    and returns the PDF binary stream for direct download.
    """
    try:
        data = req.data
        chart_urls = generate_all_charts(data)
        
        if "charts" not in data:
            data["charts"] = {}
        data["charts"].update(chart_urls)
        
        html_content = compile_template(data)
        pdf_bytes = await render_pdf(html_content)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=FinReport_{data.get('header', {}).get('company_name', 'Report').replace(' ', '_')}.pdf"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")


class HtmlFileRequest(BaseModel):
    path: str  # Absolute or project-relative path to an HTML file

@app.post("/api/render-html-file")
async def api_render_html_file(req: HtmlFileRequest):
    """
    Reads a local HTML file from disk and renders it to PDF via Playwright.
    Useful for testing temp1.html, temp2.html, etc.
    Usage: POST /api/render-html-file  body: {"path": "D:/Projects/.../temp1.html"}
    """
    html_path = Path(req.path)
    if not html_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {req.path}")
    
    html_content = html_path.read_text(encoding="utf-8")
    try:
        pdf_bytes = await render_pdf(html_content)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={html_path.stem}.pdf"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to render HTML file to PDF: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

