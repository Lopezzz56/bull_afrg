import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory (works regardless of cwd)
_BACKEND_DIR = Path(__file__).parent.parent.parent  # backend/
load_dotenv(dotenv_path=_BACKEND_DIR / ".env")

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")
    OPENROUTER_FALLBACK_MODEL: str = os.getenv("OPENROUTER_FALLBACK_MODEL", "openrouter/free")
    
    TEMPLATE_NAME: str = os.getenv("TEMPLATE_NAME", "geojit_template.html")
    TEMPLATE_PATH: str = ""
    TEMP_DIR: str = os.getenv("TEMP_DIR", str(_BACKEND_DIR / "app" / "temp"))

    def __init__(self):
        name = self.TEMPLATE_NAME
        p = Path(name)
        if p.is_absolute() and p.exists():
            self.TEMPLATE_PATH = str(p)
        elif (_BACKEND_DIR.parent / name).exists():
            self.TEMPLATE_PATH = str(_BACKEND_DIR.parent / name)
        elif (_BACKEND_DIR / name).exists():
            self.TEMPLATE_PATH = str(_BACKEND_DIR / name)
        else:
            self.TEMPLATE_PATH = str(_BACKEND_DIR / "geojit_template.html")

settings = Settings()

# Ensure the temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)
