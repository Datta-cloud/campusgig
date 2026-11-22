import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, SessionLocal
from app.models import User, PricingConfig, Order, ChatMessage, OrderAttachment, Course, CourseEnrollment
from app.database import Base
from app.services.auth_service import hash_password
from app.config import UPLOAD_DIR, CORS_ALLOWED_ORIGINS, DATABASE_URL
from app.services.storage_service import get_storage_provider_name

# Rate Limiter & SlowAPI Setup
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

# Import routers
from app.routers import auth, orders, chat, admin, courses, notifications, referrals


DEFAULT_PRICING = [
    {
        "category_key": "college_ml",
        "category_name": "Machine Learning Project",
        "student_type": "college",
        "base_price": 1500,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 350, "report": 500, "viva_guide": 300, "walkthrough_call": 400, "express": 600}
    },
    {
        "category_key": "college_genai",
        "category_name": "Generative AI / RAG Project",
        "student_type": "college",
        "base_price": 2000,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 350, "report": 500, "viva_guide": 300, "walkthrough_call": 400, "express": 600}
    },
    {
        "category_key": "college_agentic",
        "category_name": "Agentic AI System",
        "student_type": "college",
        "base_price": 2500,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 400, "report": 600, "viva_guide": 350, "walkthrough_call": 500, "express": 800}
    },
    {
        "category_key": "college_frontend",
        "category_name": "Frontend Web Development",
        "student_type": "college",
        "base_price": 1200,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 300, "report": 400, "viva_guide": 250, "walkthrough_call": 400, "express": 500}
    },
    {
        "category_key": "college_backend",
        "category_name": "Backend API Development",
        "student_type": "college",
        "base_price": 1500,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 300, "report": 400, "viva_guide": 250, "walkthrough_call": 400, "express": 500}
    },
    {
        "category_key": "college_fullstack",
        "category_name": "Full Stack Project",
        "student_type": "college",
        "base_price": 2200,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 400, "report": 500, "viva_guide": 300, "walkthrough_call": 500, "express": 700}
    },
    {
        "category_key": "college_android",
        "category_name": "Android App Development",
        "student_type": "college",
        "base_price": 2000,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 350, "report": 500, "viva_guide": 300, "walkthrough_call": 400, "express": 600}
    },
    {
        "category_key": "college_ds",
        "category_name": "Data Science / Analytics",
        "student_type": "college",
        "base_price": 1500,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 350, "report": 500, "viva_guide": 300, "walkthrough_call": 400, "express": 500}
    },
    {
        "category_key": "college_other",
        "category_name": "Other / Custom Project",
        "student_type": "college",
        "base_price": 1000,
        "unit_description": "Per Project",
        "add_ons": {"ppt": 300, "report": 400, "viva_guide": 250, "walkthrough_call": 400, "express": 400}
    },
    {
        "category_key": "school_assignment",
        "category_name": "School Assignment / Report (typed PDF)",
        "student_type": "school",
        "base_price": 50,
        "unit_description": "Per Page (min 10 pages)",
        "add_ons": {"chart_design": 150, "express": 100}
    },
    {
        "category_key": "school_project",
        "category_name": "School Project Report (Class 6-10)",
        "student_type": "school",
        "base_price": 400,
        "unit_description": "Per Project",
        "add_ons": {"chart_paper": 150, "express": 200}
    },
]


def seed_database():
    db = SessionLocal()
    try:
        # Seed admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@campusgig.com",
                username="admin",
                full_name="CampusGig Admin",
                role="admin",
                hashed_password=hash_password("Admin@CampusGig2026"),
                is_active=True,
                is_online=False
            )
            db.add(admin_user)
            print("✓ Admin user seeded")

        # Seed pricing configs
        for item in DEFAULT_PRICING:
            existing = db.query(PricingConfig).filter(
                PricingConfig.category_key == item["category_key"]
            ).first()
            if not existing:
                config = PricingConfig(
                    category_key=item["category_key"],
                    category_name=item["category_name"],
                    student_type=item["student_type"],
                    base_price=item["base_price"],
                    unit_description=item["unit_description"],
                    add_ons_json=json.dumps(item["add_ons"])
                )
                db.add(config)

        db.commit()
        print("✓ Pricing configs seeded")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    seed_database()
    yield
    # Shutdown (nothing to clean up for SQLite)


is_prod = os.getenv("ENVIRONMENT", "").lower() == "production" or os.getenv("ENABLE_DOCS", "true").lower() == "false"

app = FastAPI(
    title="CampusGig API",
    description="Freelance Platform for Students - Backend API",
    version="2.4.0",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# SlowAPI Rate Limiter Attachment
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS (Dynamic production environment support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
import os
from datetime import datetime
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Health Check & Anti-Sleep Ping Endpoint
@app.get("/api/health", tags=["System"])
def health_check():
    """
    Public health check endpoint for UptimeRobot, Render, and cloud monitoring.
    Prevents free cloud tiers from going into cold-start sleep mode.
    """
    db_status = "connected"
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"degraded: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "CampusGig Backend API",
        "version": "2.4.0",
        "database": db_status,
        "database_type": "PostgreSQL" if not DATABASE_URL.startswith("sqlite") else "SQLite",
        "storage_provider": get_storage_provider_name(),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Register routers
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(courses.router)
app.include_router(notifications.router)
app.include_router(referrals.router)


@app.get("/api/verify-certificate/{cert_id}")
def public_verify_cert(cert_id: str):
    db = SessionLocal()
    try:
        from app.models.order import Order
        from fastapi import HTTPException
        order = db.query(Order).filter(Order.certificate_id == cert_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Certificate not found in CampusGig Registry")
        return {
            "valid": True,
            "certificate_id": order.certificate_id,
            "order_number": order.order_number,
            "student_name": order.student.full_name or order.student.username if order.student else "Verified Student",
            "college_name": order.student.college_name if order.student else "Accredited University",
            "project_title": order.project_title,
            "domain": order.domain or order.category_key,
            "issued_date": order.certificate_issued_at.strftime("%B %d, %Y") if order.certificate_issued_at else "November 2026",
            "plagiarism_score": order.plagiarism_score or 4.2,
            "ai_score": order.ai_detection_score or 0.0,
            "honors": "Distinction in Implementation & Architecture",
            "verified_by": "CampusGig Academic Council & Mentor Board"
        }
    finally:
        db.close()




