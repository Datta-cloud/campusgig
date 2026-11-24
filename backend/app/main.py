import os
import json
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import User, PricingConfig, Order, ChatMessage, OrderAttachment, Course, CourseEnrollment, PaymentSubmission, WalkthroughSession
from app.database import Base
from app.services.auth_service import hash_password
from app.config import UPLOAD_DIR, UPLOAD_DIR_REFERENCES, UPLOAD_DIR_THUMBNAILS, CORS_ALLOWED_ORIGINS, DATABASE_URL
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
        "add_ons": {
            "chart_diagrams": 150,
            "chart_design": 150,
            "solved_questions": 100,
            "formula_sheet": 100,
            "concept_call": 250,
            "express": 150
        }
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
        # Seed sole primary admin user: DattaHadke / Datta@123
        admin_user = db.query(User).filter(User.username == "DattaHadke").first()
        admin_initial_pw = os.getenv("ADMIN_PASSWORD", "Datta@123")
        hashed_pw = hash_password(admin_initial_pw)
        if not admin_user:
            admin_user = User(
                email="hadkedattatray487@gmail.com",
                username="DattaHadke",
                full_name="Datta Hadke",
                role="admin",
                hashed_password=hashed_pw,
                phone="7020209079",
                is_active=True,
                is_online=False
            )
            db.add(admin_user)
            print("✓ Admin user DattaHadke seeded")
        else:
            admin_user.hashed_password = hashed_pw
            admin_user.role = "admin"
            admin_user.full_name = "Datta Hadke"
            admin_user.email = "hadkedattatray487@gmail.com"

        # Remove any other admin accounts
        db.query(User).filter(User.role == "admin", User.username != "DattaHadke").delete(synchronize_session=False)

        # Seed pricing configs & ensure college_ml base price is 1500
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
            else:
                if item["category_key"] == "college_ml":
                    existing.base_price = 1500.0
                elif item["category_key"] == "school_assignment":
                    existing.add_ons_json = json.dumps(item["add_ons"])

        db.commit()
        print("✓ Pricing configs and admin verified")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created")

        # Safe automatic schema migrations for newly added columns (Postgres & SQLite compatible)
        columns_to_add = [
            ("orders", "walkthrough_count", "INTEGER DEFAULT 0"),
            ("orders", "walkthrough_scheduled_at", "TIMESTAMP"),
            ("orders", "walkthrough_meeting_url", "VARCHAR"),
            ("orders", "coupon_code", "VARCHAR"),
            ("orders", "discount_amount", "FLOAT DEFAULT 0.0"),
            ("orders", "payment_verified", "BOOLEAN DEFAULT FALSE"),
            ("orders", "certificate_id", "VARCHAR"),
            ("orders", "certificate_issued_at", "TIMESTAMP"),
            ("orders", "github_repo_url", "VARCHAR"),
            ("orders", "deployed_url", "VARCHAR"),
            ("orders", "deployed_at", "TIMESTAMP"),
            ("orders", "plagiarism_score", "FLOAT"),
            ("orders", "ai_detection_score", "FLOAT"),
            ("orders", "plagiarism_report_url", "VARCHAR"),
            ("order_group_members", "qr_token", "VARCHAR"),
            ("users", "wallet_balance", "FLOAT DEFAULT 0.0"),
        ]
        for table, col, col_def in columns_to_add:
            try:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
            except Exception:
                pass

        # Ensure payment_submissions table exists (Postgres & SQLite)
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS payment_submissions (
                        id SERIAL PRIMARY KEY,
                        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        payment_type VARCHAR NOT NULL,
                        amount FLOAT NOT NULL,
                        utr_number VARCHAR NOT NULL,
                        status VARCHAR DEFAULT 'pending',
                        admin_notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        verified_at TIMESTAMP
                    )
                """))
        except Exception:
            try:
                with engine.begin() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS payment_submissions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            order_id INTEGER NOT NULL,
                            student_id INTEGER NOT NULL,
                            payment_type VARCHAR NOT NULL,
                            amount REAL NOT NULL,
                            utr_number VARCHAR NOT NULL,
                            status VARCHAR DEFAULT 'pending',
                            admin_notes TEXT,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            verified_at DATETIME
                        )
                    """))
            except Exception as e:
                print(f"⚠️ payment_submissions table note: {e}")

        # Ensure walkthrough_sessions table exists (Postgres & SQLite)
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS walkthrough_sessions (
                        id SERIAL PRIMARY KEY,
                        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                        student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        session_number INTEGER DEFAULT 1,
                        topic VARCHAR,
                        scheduled_at TIMESTAMP NOT NULL,
                        duration_minutes INTEGER DEFAULT 30,
                        meeting_url VARCHAR NOT NULL,
                        status VARCHAR DEFAULT 'scheduled',
                        mentor_notes TEXT,
                        recording_url VARCHAR,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
        except Exception:
            try:
                with engine.begin() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS walkthrough_sessions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            order_id INTEGER NOT NULL,
                            student_id INTEGER NOT NULL,
                            session_number INTEGER DEFAULT 1,
                            topic VARCHAR,
                            scheduled_at DATETIME NOT NULL,
                            duration_minutes INTEGER DEFAULT 30,
                            meeting_url VARCHAR NOT NULL,
                            status VARCHAR DEFAULT 'scheduled',
                            mentor_notes TEXT,
                            recording_url VARCHAR,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
            except Exception as e:
                print(f"⚠️ walkthrough_sessions table note: {e}")

        # Reset default artificial wallet balances to 0.0 for users without referrals
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    UPDATE users 
                    SET wallet_balance = 0.0 
                    WHERE id NOT IN (
                        SELECT DISTINCT u.id 
                        FROM users u 
                        JOIN users ref ON ref.referred_by = u.referral_code
                    )
                """))
        except Exception as mig_err:
            print(f"⚠️ Wallet reset note: {mig_err}")

        # Ensure coupons table exists
        try:
            with engine.begin() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS coupons (
                        id SERIAL PRIMARY KEY,
                        code VARCHAR UNIQUE NOT NULL,
                        discount_percent FLOAT NOT NULL DEFAULT 10.0,
                        max_uses INTEGER NOT NULL DEFAULT 100,
                        used_count INTEGER NOT NULL DEFAULT 0,
                        is_active BOOLEAN DEFAULT TRUE,
                        description VARCHAR,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
        except Exception:
            try:
                with engine.begin() as conn:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS coupons (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            code VARCHAR UNIQUE NOT NULL,
                            discount_percent FLOAT NOT NULL DEFAULT 10.0,
                            max_uses INTEGER NOT NULL DEFAULT 100,
                            used_count INTEGER NOT NULL DEFAULT 0,
                            is_active BOOLEAN DEFAULT 1,
                            description VARCHAR,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
            except Exception as inner_e:
                print(f"⚠️ Coupon table setup note: {inner_e}")

        seed_database()
    except Exception as e:
        print(f"⚠️ Database startup check: {e}")
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

# CORS (Strict production environment support)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://(campusgig-ai\.vercel\.app|campusgig(-[a-z0-9]+)?-datta-clouds-projects\.vercel\.app|frontend-delta-ashy-82\.vercel\.app)$|^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure static file serving: Only references and thumbnails are public. Deliverables require authenticated access.
import os
from datetime import datetime
os.makedirs(UPLOAD_DIR_REFERENCES, exist_ok=True)
os.makedirs(UPLOAD_DIR_THUMBNAILS, exist_ok=True)
app.mount("/uploads/references", StaticFiles(directory=UPLOAD_DIR_REFERENCES), name="references")
app.mount("/uploads/thumbnails", StaticFiles(directory=UPLOAD_DIR_THUMBNAILS), name="thumbnails")

# Health Check & Monitoring Endpoints (Pings database to verify live connectivity)
@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check():
    """
    Active health check endpoint verifying database connectivity and service readiness.
    """
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

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

        issued_date = None
        if order.certificate_issued_at:
            issued_date = order.certificate_issued_at.strftime("%B %d, %Y")
        elif order.completed_at:
            issued_date = order.completed_at.strftime("%B %d, %Y")

        return {
            "valid": True,
            "certificate_id": order.certificate_id,
            "order_number": order.order_number,
            "student_name": order.student.full_name or order.student.username if order.student else "Verified Student",
            "college_name": order.student.college_name if order.student else "Accredited University",
            "project_title": order.project_title,
            "domain": order.domain or order.category_key,
            "issued_date": issued_date,
            "plagiarism_score": order.plagiarism_score,
            "ai_score": order.ai_detection_score,
            "honors": "Distinction in Implementation & Architecture",
            "verified_by": "CampusGig Academic Council & Mentor Board"
        }
    finally:
        db.close()


@app.post("/api/ai/academic-assistant")
def global_academic_assistant(req: dict):
    from app.services.ai_service import ask_academic_assistant
    from fastapi import HTTPException
    message = (req.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    return ask_academic_assistant(message, req.get("student_type", "college"), req.get("context"))


@app.get("/api/public/platform-stats")
def get_public_platform_stats():
    db = SessionLocal()
    try:
        from app.models.order import Order
        from app.models.user import User
        from app.models.pricing import PricingConfig

        total_orders = db.query(Order).count()
        completed_orders = db.query(Order).filter(Order.status == "completed").count()
        active_streams = db.query(PricingConfig).filter(PricingConfig.is_active == True).count()
        registered_users = db.query(User).count()

        return {
            "total_projects": max(total_orders, 12),
            "completed_deliveries": max(completed_orders, 8),
            "registered_students": max(registered_users, 15),
            "active_academic_streams": active_streams or 9,
            "turnaround_hours": "24–48h",
            "plagiarism_guarantee": "< 10% Turnitin Verified",
            "average_mentor_rating": 4.9,
            "escrow_advance_percent": 30,
        }
    finally:
        db.close()


@app.get("/api/public/featured-gigs")
def get_public_featured_gigs():
    return [
        {
            "id": "gig_ml_crop",
            "category_key": "college_ml",
            "category_name": "Machine Learning",
            "title": "Crop Recommendation & Yield Prediction System with Streamlit Dashboard",
            "domain": "College Engineering",
            "description": "Production ML model using Random Forest & XGBoost with soil NPK feature analysis, confusion matrix evaluation, and interactive Streamlit UI.",
            "thumbnail": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
            "starting_price": 1500,
            "delivery_time": "3–5 Days",
            "rating": 4.9,
            "reviews_count": 34,
            "mentor": {
                "name": "Dr. Rohit Sharma",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                "role": "Senior ML Mentor & IIT Alum",
                "verified": True
            },
            "tags": ["Python", "Scikit-Learn", "Streamlit", "IEEE Paper", "Dataset"]
        },
        {
            "id": "gig_genai_rag",
            "category_key": "college_genai",
            "category_name": "Generative AI",
            "title": "Multimodal Medical Report Analyzer with Gemini 2.0 & LangChain RAG",
            "domain": "College Engineering",
            "description": "Enterprise-grade RAG pipeline using FAISS vector database, Gemini vision API for X-ray/PDF diagnostics, and citation verification.",
            "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
            "starting_price": 1800,
            "delivery_time": "3–5 Days",
            "rating": 5.0,
            "reviews_count": 29,
            "mentor": {
                "name": "Ananya Sen",
                "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
                "role": "AI Research Scholar",
                "verified": True
            },
            "tags": ["Gemini 2.0", "LangChain", "FAISS", "FastAPI", "React"]
        },
        {
            "id": "gig_agentic_ai",
            "category_key": "college_agentic",
            "category_name": "Agentic AI",
            "title": "Autonomous Multi-Agent Market Intelligence & Research Engine",
            "domain": "College Engineering",
            "description": "Collaborative agentic workflow built with CrewAI / AutoGen with real-time web scraping tools, markdown reporting, and confidence scoring.",
            "thumbnail": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
            "starting_price": 2200,
            "delivery_time": "4–6 Days",
            "rating": 4.9,
            "reviews_count": 22,
            "mentor": {
                "name": "Vikram Adve",
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                "role": "Autonomous Systems Engineer",
                "verified": True
            },
            "tags": ["CrewAI", "Python", "Tool Calling", "Vector DB", "Agents"]
        },
        {
            "id": "gig_fullstack_hospital",
            "category_key": "college_fullstack",
            "category_name": "Full-Stack Dev",
            "title": "Hospital Management & Patient Appointment Portal with Tele-Consult",
            "domain": "College Engineering",
            "description": "Full-stack web application with role-based JWT auth, PostgreSQL migrations, WebRTC tele-consultation rooms, and Razorpay billing.",
            "thumbnail": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
            "starting_price": 1600,
            "delivery_time": "3–5 Days",
            "rating": 4.8,
            "reviews_count": 41,
            "mentor": {
                "name": "Kunal Verma",
                "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
                "role": "Full-Stack Architect",
                "verified": True
            },
            "tags": ["React", "FastAPI", "PostgreSQL", "JWT", "Tailwind"]
        },
        {
            "id": "gig_school_math",
            "category_key": "school_assignment",
            "category_name": "School Assignment",
            "title": "Class 10th Mathematics: Triangles, Similarity & Theorem Proofs Notes",
            "domain": "School (Class 1-10th)",
            "description": "High-yield printable A4 notes covering Basic Proportionality Theorem, similarity criteria, 15+ solved exemplar problems, and geometric diagrams.",
            "thumbnail": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
            "starting_price": 500,
            "delivery_time": "2–3 Days",
            "rating": 5.0,
            "reviews_count": 38,
            "mentor": {
                "name": "Pooja Hegde",
                "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
                "role": "CBSE Math Educator",
                "verified": True
            },
            "tags": ["Class 10th", "Mathematics", "BPT Theorem", "Exemplar", "Printable PDF"]
        },
        {
            "id": "gig_android_food",
            "category_key": "college_android",
            "category_name": "Android Mobile App",
            "title": "Campus Food Delivery & Mess Attendance Mobile App with Live GPS",
            "domain": "College Engineering",
            "description": "Modern cross-platform mobile application built with React Native / Flutter featuring Firebase authentication, SQLite caching, and live GPS map tracking.",
            "thumbnail": "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80",
            "starting_price": 1700,
            "delivery_time": "3–5 Days",
            "rating": 4.9,
            "reviews_count": 27,
            "mentor": {
                "name": "Siddharth Rao",
                "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
                "role": "Mobile App Lead",
                "verified": True
            },
            "tags": ["React Native", "Flutter", "Firebase", "APK Build", "Maps API"]
        }
    ]




