import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")

# PostgreSQL / Cloud Database Support (Render / Supabase / Neon fix)
raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./campusgig.db")
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
    DATABASE_URL = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    DATABASE_URL = raw_db_url

# Webhook Secrets & Security
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://campusgig-ai.vercel.app,https://frontend-delta-ashy-82.vercel.app"
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]
SECRET_KEY = os.getenv("SECRET_KEY", "campusgig-super-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
UPLOAD_DIR_REFERENCES = os.path.join(UPLOAD_DIR, "references")
UPLOAD_DIR_DELIVERABLES = os.path.join(UPLOAD_DIR, "deliverables")
UPLOAD_DIR_THUMBNAILS = os.path.join(UPLOAD_DIR, "thumbnails")

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "500"))  # 500 MB max file size for heavy ZIPs & Videos

# Ensure upload directories exist
for _dir in [UPLOAD_DIR, UPLOAD_DIR_REFERENCES, UPLOAD_DIR_DELIVERABLES, UPLOAD_DIR_THUMBNAILS]:
    os.makedirs(_dir, exist_ok=True)
