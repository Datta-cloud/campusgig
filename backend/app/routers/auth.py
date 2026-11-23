from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin
)
from app.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    student_type: str  # "school" / "college"
    school_class: Optional[str] = None
    college_name: Optional[str] = None
    college_branch: Optional[str] = None
    referral_code: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    college_name: Optional[str] = None
    college_branch: Optional[str] = None
    school_class: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    student_type: Optional[str]
    school_class: Optional[str]
    college_name: Optional[str]
    college_branch: Optional[str]
    is_active: bool
    is_online: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check email uniqueness
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Check username uniqueness
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    if req.student_type not in ("school", "college"):
        raise HTTPException(status_code=400, detail="student_type must be 'school' or 'college'")

    # Generate guaranteed unique personal referral code
    import random, string
    clean_username = "".join(c for c in req.username if c.isalnum()).upper()[:4] or "CAMP"
    rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    my_referral_code = f"{clean_username}{rand_suffix}"
    # In the rare event of collision, retry
    while db.query(User).filter(User.referral_code == my_referral_code).first():
        rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        my_referral_code = f"{clean_username}{rand_suffix}"

    user = User(
        email=req.email,
        username=req.username,
        full_name=req.full_name,
        phone=req.phone,
        role="student",
        student_type=req.student_type,
        school_class=req.school_class,
        college_name=req.college_name,
        college_branch=req.college_branch,
        hashed_password=hash_password(req.password),
        referral_code=my_referral_code,
        wallet_balance=0.0,
        is_active=True,
        is_online=True
    )

    # Process referral reward if code was provided (prevent self-referral)
    if req.referral_code:
        ref_code_clean = req.referral_code.strip().upper()
        referrer = db.query(User).filter(User.referral_code == ref_code_clean).first()
        if referrer and referrer.email.lower() != req.email.lower() and referrer.username.lower() != req.username.lower():
            user.referred_by = referrer.referral_code
            referrer.wallet_balance = (referrer.wallet_balance or 0.0) + 250.0

            from app.services.notification_service import create_notification
            create_notification(
                db=db,
                user_id=referrer.id,
                title="Campus Referral Reward Earned! 🎁",
                message=f"Your friend {req.full_name or req.username} joined using your code {ref_code_clean}! ₹250 added to your wallet.",
                channel="in_app",
                action_url="/dashboard"
            )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "student_type": user.student_type,
            "college_name": user.college_name,
            "college_branch": user.college_branch,
            "school_class": user.school_class,
            "phone": user.phone,
            "is_online": user.is_online
        }
    }


@router.post("/login")
@limiter.limit("60/minute")
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    expected_role = None
    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username", "")
            password = body.get("password", "")
            expected_role = body.get("role") or body.get("expected_role")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    else:
        form = await request.form()
        username = str(form.get("username", ""))
        password = str(form.get("password", ""))
        expected_role = form.get("role") or form.get("expected_role")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    # Strict Role Isolation: Student cannot use Admin Login, Admin cannot use Student Login
    if expected_role:
        clean_expected = str(expected_role).lower().strip()
        if clean_expected == "admin" and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This account does not have administrator privileges. Please use Student Login."
            )
        if clean_expected == "student" and user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator account detected. Please use the Admin Login portal."
            )

    # Update online status
    user.is_online = True
    user.last_seen = datetime.utcnow()
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "student_type": user.student_type,
            "college_name": user.college_name,
            "college_branch": user.college_branch,
            "school_class": user.school_class,
            "phone": user.phone,
            "is_online": user.is_online
        }
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.is_online = False
    current_user.last_seen = datetime.utcnow()
    db.commit()
    return {"message": "Logged out successfully"}


@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.phone is not None:
        current_user.phone = req.phone
    if req.college_name is not None:
        current_user.college_name = req.college_name
    if req.college_branch is not None:
        current_user.college_branch = req.college_branch
    if req.school_class is not None:
        current_user.school_class = req.school_class
    db.commit()
    db.refresh(current_user)
    return current_user
