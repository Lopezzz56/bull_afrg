import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import jinja2
from backend.app.core.config import settings

# Thread pool for running sync playwright safely on all platforms
_THREAD_POOL = ThreadPoolExecutor(max_workers=2)

# __file__-relative path — always resolves correctly
_BACKEND_DIR = Path(__file__).parent.parent.parent
_DEFAULT_TEMPLATE_PATH = _BACKEND_DIR / "geojit_template.html"

def compile_template(data: dict, template_path: str = None) -> str:
    """
    Loads and compiles the geojit_template.html Jinja2 template with the report data.
    All missing keys are filled with safe defaults.
    """
    if template_path is None:
        # Prefer env-configured path, fall back to file-relative default
        env_path = settings.TEMPLATE_PATH
        if env_path and os.path.exists(env_path):
            template_path = env_path
        elif _DEFAULT_TEMPLATE_PATH.exists():
            template_path = str(_DEFAULT_TEMPLATE_PATH)
        else:
            raise FileNotFoundError("Template file not found. Set TEMPLATE_PATH in .env or ensure geojit_template.html is in the backend directory.")

    # Fill missing keys with safe defaults using Pydantic
    from backend.app.schemas import ReportData
    try:
        safe_data = ReportData(**data).model_dump()
    except Exception:
        safe_data = data  # fallback — use as-is

    with open(template_path, "r", encoding="utf-8") as f:
        template_content = f.read()

    env = jinja2.Environment(
        undefined=jinja2.ChainableUndefined,  # silently chains & returns '' for missing attrs
    )
    template = env.from_string(template_content)
    return template.render(data=safe_data)


def _render_pdf_sync(html_content: str) -> bytes:
    """
    Synchronous Playwright PDF render — must be called from a thread, not the asyncio event loop.
    Avoids Python 3.14 Windows asyncio subprocess NotImplementedError.
    """
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content(html_content, wait_until="networkidle")
        pdf_bytes = page.pdf(
            format="A4",
            print_background=True,
            display_header_footer=False,
            scale=1.0,
        )
        browser.close()
        return pdf_bytes

async def render_pdf(html_content: str) -> bytes:
    """
    Async wrapper — runs the sync Playwright call in a thread pool executor
    so it doesn't block the FastAPI event loop and avoids the Windows asyncio
    subprocess limitation in Python 3.13+.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_THREAD_POOL, _render_pdf_sync, html_content)
