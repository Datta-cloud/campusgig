import json
import os
import shutil
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database import get_db
from app.models.order import Order, OrderGroupMember
from app.models.user import User
from app.models.pricing import PricingConfig
from app.models.coupon import Coupon
from app.models.payment_submission import PaymentSubmission
from app.models.attachment import OrderAttachment
from app.models.chat import ChatMessage
from app.models.course import CourseEnrollment
from app.models.notification import Notification
from app.models.walkthrough_session import WalkthroughSession
from app.services.auth_service import require_admin, hash_password
from app.config import UPLOAD_DIR_DELIVERABLES, MAX_FILE_SIZE_MB

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class PricingUpdateRequest(BaseModel):
    category_name: Optional[str] = None
    base_price: Optional[float] = None
    unit_description: Optional[str] = None
    add_ons_json: Optional[str] = None
    is_active: Optional[bool] = None


class PricingCreateRequest(BaseModel):
    category_key: str
    category_name: str
    student_type: str
    base_price: float
    unit_description: Optional[str] = "Per Project"
    add_ons_json: Optional[str] = None
    is_active: bool = True


@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_orders = db.query(Order).count()
    pending_payment = db.query(Order).filter(Order.status == "pending_payment").count()
    advance_paid = db.query(Order).filter(Order.status == "advance_paid").count()
    in_progress = db.query(Order).filter(Order.status == "in_progress").count()
    completed = db.query(Order).filter(Order.status == "completed").count()
    cancelled = db.query(Order).filter(Order.status == "cancelled").count()

    # Revenue: sum of total_price for completed orders + advance for advance_paid
    completed_orders = db.query(Order).filter(Order.status == "completed").all()
    total_revenue = sum(o.total_price for o in completed_orders)

    advance_paid_orders = db.query(Order).filter(Order.status.in_(["advance_paid", "in_progress", "ready_for_review"])).all()
    advance_collected = sum(o.advance_amount for o in advance_paid_orders)

    active_students = db.query(User).filter(User.role == "student", User.is_active == True).count()
    online_students = db.query(User).filter(User.role == "student", User.is_online == True).count()

    # Recent orders
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()

    return {
        "stats": {
            "total_orders": total_orders,
            "pending_payment": pending_payment,
            "advance_paid": advance_paid,
            "in_progress": in_progress,
            "completed": completed,
            "cancelled": cancelled,
            "total_revenue": round(total_revenue, 2),
            "advance_collected": round(advance_collected, 2),
            "active_students": active_students,
            "online_students": online_students
        },
        "recent_orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "project_title": o.project_title,
                "student_id": o.student_id,
                "status": o.status,
                "total_price": o.total_price,
                "created_at": o.created_at.isoformat() if o.created_at else None
            } for o in recent_orders
        ]
    }


@router.get("/pricing")
def list_pricing(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    configs = db.query(PricingConfig).all()
    return [
        {
            "id": c.id,
            "category_key": c.category_key,
            "category_name": c.category_name,
            "student_type": c.student_type,
            "base_price": c.base_price,
            "unit_description": c.unit_description,
            "add_ons": json.loads(c.add_ons_json) if c.add_ons_json else {},
            "is_active": c.is_active,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        } for c in configs
    ]


@router.post("/pricing")
def create_pricing(
    req: PricingCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(PricingConfig).filter(PricingConfig.category_key == req.category_key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category key already exists")

    config = PricingConfig(
        category_key=req.category_key,
        category_name=req.category_name,
        student_type=req.student_type,
        base_price=req.base_price,
        unit_description=req.unit_description,
        add_ons_json=req.add_ons_json,
        is_active=req.is_active
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return {"message": "Pricing config created", "id": config.id}


@router.put("/pricing/{config_id}")
def update_pricing(
    config_id: int,
    req: PricingUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    config = db.query(PricingConfig).filter(PricingConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Pricing config not found")

    if req.category_name is not None:
        config.category_name = req.category_name
    if req.base_price is not None:
        config.base_price = req.base_price
    if req.unit_description is not None:
        config.unit_description = req.unit_description
    if req.add_ons_json is not None:
        config.add_ons_json = req.add_ons_json
    if req.is_active is not None:
        config.is_active = req.is_active
    config.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(config)
    return {"message": "Pricing config updated", "id": config.id}


class CouponCreateRequest(BaseModel):
    code: str
    discount_percent: float
    max_uses: int = 100
    is_active: bool = True
    description: Optional[str] = None


class CouponUpdateRequest(BaseModel):
    discount_percent: Optional[float] = None
    max_uses: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


@router.get("/coupons")
def list_coupons(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    coupons = db.query(Coupon).order_by(Coupon.id.desc()).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "discount_percent": c.discount_percent,
            "max_uses": c.max_uses,
            "used_count": c.used_count or 0,
            "is_active": c.is_active,
            "description": c.description,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        }
        for c in coupons
    ]


@router.post("/coupons")
def create_coupon(
    req: CouponCreateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    clean_code = req.code.strip().upper()
    if not clean_code:
        raise HTTPException(status_code=400, detail="Coupon code is required")
    if req.discount_percent <= 0 or req.discount_percent > 100:
        raise HTTPException(status_code=400, detail="Discount percentage must be between 1 and 100")
    if req.max_uses < 0:
        raise HTTPException(status_code=400, detail="Max uses cannot be negative")

    existing = db.query(Coupon).filter(Coupon.code == clean_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Coupon code '{clean_code}' already exists")

    coupon = Coupon(
        code=clean_code,
        discount_percent=req.discount_percent,
        max_uses=req.max_uses,
        used_count=0,
        is_active=req.is_active,
        description=req.description
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return {"message": "Coupon created successfully", "id": coupon.id, "code": coupon.code}


@router.put("/coupons/{coupon_id}")
def update_coupon(
    coupon_id: int,
    req: CouponUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if req.discount_percent is not None:
        if req.discount_percent <= 0 or req.discount_percent > 100:
            raise HTTPException(status_code=400, detail="Discount percentage must be between 1 and 100")
        coupon.discount_percent = req.discount_percent

    if req.max_uses is not None:
        if req.max_uses < 0:
            raise HTTPException(status_code=400, detail="Max uses cannot be negative")
        coupon.max_uses = req.max_uses

    if req.is_active is not None:
        coupon.is_active = req.is_active

    if req.description is not None:
        coupon.description = req.description

    coupon.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(coupon)
    return {"message": "Coupon updated successfully", "id": coupon.id, "code": coupon.code}


@router.delete("/coupons/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    code = coupon.code
    db.delete(coupon)
    db.commit()
    return {"message": f"Coupon '{code}' deleted successfully"}


@router.get("/students")
def list_students(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    students = db.query(User).filter(User.role == "student").offset(skip).limit(limit).all()
    total = db.query(User).filter(User.role == "student").count()

    result = []
    for s in students:
        order_count = db.query(Order).filter(Order.student_id == s.id).count()
        completed_count = db.query(Order).filter(Order.student_id == s.id, Order.status == "completed").count()
        total_spent = db.query(func.sum(Order.total_price)).filter(
            Order.student_id == s.id, Order.status == "completed"
        ).scalar() or 0.0

        result.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name,
            "email": s.email,
            "phone": s.phone,
            "student_type": s.student_type,
            "college_name": s.college_name,
            "college_branch": s.college_branch,
            "school_class": s.school_class,
            "is_active": s.is_active,
            "is_online": s.is_online,
            "last_seen": s.last_seen.isoformat() if s.last_seen else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "stats": {
                "total_orders": order_count,
                "completed_orders": completed_count,
                "total_spent": round(total_spent, 2)
            }
        })

    return {"total": total, "students": result}


@router.get("/analytics")
def get_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    since = datetime.utcnow() - timedelta(days=days)
    orders = db.query(Order).filter(Order.created_at >= since).all()

    # Revenue over time (by day)
    revenue_by_day = {}
    orders_by_domain = {}
    payment_method_breakdown = {"upi": 0, "razorpay": 0, "cash": 0, "unknown": 0}
    status_breakdown = {}

    for o in orders:
        # Revenue
        if o.created_at:
            day_key = o.created_at.strftime("%Y-%m-%d")
            if day_key not in revenue_by_day:
                revenue_by_day[day_key] = {"date": day_key, "revenue": 0, "orders": 0}
            if o.status == "completed":
                revenue_by_day[day_key]["revenue"] += o.total_price
            revenue_by_day[day_key]["orders"] += 1

        # Domain
        domain = o.domain or "Other"
        orders_by_domain[domain] = orders_by_domain.get(domain, 0) + 1

        # Payment method
        pm = o.payment_method or "unknown"
        if pm in payment_method_breakdown:
            payment_method_breakdown[pm] += 1
        else:
            payment_method_breakdown["unknown"] += 1

        # Status
        status_breakdown[o.status] = status_breakdown.get(o.status, 0) + 1

    return {
        "period_days": days,
        "revenue_over_time": sorted(revenue_by_day.values(), key=lambda x: x["date"]),
        "orders_by_domain": [{"domain": k, "count": v} for k, v in orders_by_domain.items()],
        "payment_method_breakdown": [{"method": k, "count": v} for k, v in payment_method_breakdown.items()],
        "status_breakdown": [{"status": k, "count": v} for k, v in status_breakdown.items()],
        "total_orders_in_period": len(orders),
        "total_revenue_in_period": round(sum(o.total_price for o in orders if o.status == "completed"), 2)
    }


@router.post("/orders/{order_id}/upload-deliverable")
async def upload_deliverable(
    order_id: int,
    file: UploadFile = File(...),
    file_type: str = Form("deliverable"),
    phase_name: Optional[str] = Form(None),
    updated_total_price: Optional[float] = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update amount if specified
    if updated_total_price is not None and updated_total_price > 0:
        order.total_price = float(updated_total_price)
        order.balance_amount = max(0.0, order.total_price - (order.advance_amount or 0.0))

    # Check file size limit (up to MAX_FILE_SIZE_MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB (received {round(file_size / (1024 * 1024), 2)}MB)"
        )

    # Save file
    safe_filename = f"{order.order_number}_{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR_DELIVERABLES, safe_filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_url = f"/uploads/deliverables/{safe_filename}"
    display_type = phase_name if phase_name else file_type

    attachment = OrderAttachment(
        order_id=order_id,
        file_name=file.filename,
        file_url=file_url,
        file_type=display_type,
        uploaded_by="admin"
    )
    db.add(attachment)

    # Auto-transition to ready_for_review if advance_paid, in_progress or revision_requested
    if order.status in ("in_progress", "advance_paid", "revision_requested"):
        order.status = "ready_for_review"

        from app.services.notification_service import create_notification
        create_notification(
            db=db,
            user_id=order.student_id,
            title="Deliverable Ready for Review! 📦",
            message=f"Mentor uploaded '{file.filename}' for {order.order_number}. Remaining fee is ₹{order.balance_amount}. Inspect previews and pay balance to unlock.",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )

    db.commit()
    db.refresh(attachment)

    return {
        "message": "File uploaded successfully",
        "file_url": file_url,
        "attachment_id": attachment.id,
        "file_type": display_type,
        "order_status": order.status,
        "total_price": order.total_price,
        "balance_amount": order.balance_amount
    }


@router.get("/online-status")
def get_admin_online_status(db: Session = Depends(get_db)):
    admin_user = db.query(User).filter(User.role == "admin").first()
    return {
        "is_online": admin_user.is_online if admin_user else True,
        "status": "online"
    }


class PlagiarismUpdateRequest(BaseModel):
    plagiarism_score: float
    ai_detection_score: float
    report_url: Optional[str] = None


@router.put("/orders/{order_id}/plagiarism")
def update_plagiarism_scores(
    order_id: int,
    req: PlagiarismUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.plagiarism_score = req.plagiarism_score
    order.ai_detection_score = req.ai_detection_score
    if req.report_url:
        order.plagiarism_report_url = req.report_url

    db.commit()
    db.refresh(order)

    from app.services.notification_service import create_notification
    create_notification(
        db=db,
        user_id=order.student_id,
        title="Plagiarism Verification Attached 🛡️",
        message=f"Originality Report: {req.plagiarism_score}% similarity, {req.ai_detection_score}% AI detection. Turnitin badge unlocked.",
        order_id=order.id,
        channel="in_app",
        action_url=f"/order/{order.id}"
    )

    return {
        "message": "Plagiarism scores updated successfully",
        "plagiarism_score": req.plagiarism_score,
        "ai_detection_score": req.ai_detection_score,
        "plagiarism_report_url": order.plagiarism_report_url
    }


class VerifyPaymentRequest(BaseModel):
    action: str  # "approve" or "reject"
    notes: Optional[str] = None


@router.post("/orders/{order_id}/verify-payment")
def verify_order_payment(
    order_id: int,
    req: VerifyPaymentRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    from app.services.notification_service import create_notification
    import uuid

    pending_sub = db.query(PaymentSubmission).filter(
        PaymentSubmission.order_id == order.id,
        PaymentSubmission.status == "pending"
    ).order_by(PaymentSubmission.created_at.desc()).first()

    pay_type = pending_sub.payment_type if pending_sub else ("balance" if order.status == "balance_submitted" else "advance")
    sub_amount = float(pending_sub.amount) if pending_sub else (float(order.balance_amount) if pay_type == "balance" else float(order.advance_amount))
    sub_utr = pending_sub.utr_number if pending_sub else (order.utr_number or "DIRECT_UPI")

    if req.action == "approve":
        if pay_type == "balance":
            order.balance_amount = max(0.0, round(float(order.balance_amount) - sub_amount, 2))
            is_fully_settled = (order.balance_amount <= 0.01)

            if is_fully_settled:
                order.balance_amount = 0.0
                order.status = "completed"
                order.completed_at = datetime.utcnow()
                order.payment_verified = True
                if not order.certificate_id:
                    order.certificate_id = f"CG-CERT-2026-{uuid.uuid4().hex[:8].upper()}"
                    order.certificate_issued_at = datetime.utcnow()
                title = "Balance Payment Verified & Deliverables Unlocked! 🎉"
                msg = f"Your final balance payment of ₹{sub_amount} (UTR: {sub_utr}) for {order.order_number} has been verified. All deliverables are 100% unlocked!"
            else:
                # Partial balance payment approved: remaining balance still due!
                has_deliverables = any(att.file_type == "deliverable" for att in (order.attachments or []))
                order.status = "ready_for_review" if has_deliverables else "in_progress"
                order.payment_verified = False
                title = f"Partial Payment of ₹{sub_amount} Verified! 💳"
                msg = f"Your partial payment of ₹{sub_amount} (UTR: {sub_utr}) for {order.order_number} has been verified. Remaining balance: ₹{order.balance_amount}. You can pay the rest anytime."
        else:
            order.status = "advance_paid"
            order.payment_verified = True
            order.advance_paid_at = datetime.utcnow()
            title = "Advance Payment Verified & Development Started! 🚀"
            msg = f"Your advance payment of ₹{sub_amount} (UTR: {sub_utr}) for {order.order_number} has been verified in our bank account. Development is in progress!"

        if pending_sub:
            pending_sub.status = "approved"
            pending_sub.verified_at = datetime.utcnow()
            if req.notes:
                pending_sub.admin_notes = req.notes

        if req.notes:
            order.admin_notes = req.notes
        db.commit()
        db.refresh(order)

        create_notification(
            db=db,
            user_id=order.student_id,
            title=title,
            message=msg,
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )
        return {
            "success": True,
            "message": f"Payment of ₹{sub_amount} for order {order.order_number} verified and approved.",
            "status": order.status,
            "balance_amount": order.balance_amount,
            "payment_verified": order.payment_verified
        }
    elif req.action == "reject":
        if pending_sub:
            pending_sub.status = "rejected"
            if req.notes:
                pending_sub.admin_notes = req.notes

        if pay_type == "balance":
            has_deliverables = any(att.file_type == "deliverable" for att in (order.attachments or []))
            order.status = "ready_for_review" if has_deliverables else "in_progress"
        else:
            order.status = "pending_payment"
        order.payment_verified = False
        order.utr_number = None
        if req.notes:
            order.admin_notes = req.notes
        db.commit()
        db.refresh(order)

        create_notification(
            db=db,
            user_id=order.student_id,
            title="⚠️ Payment Verification Rejected",
            message=f"Transaction UTR {sub_utr} could not be verified in our bank statement. Reason: {req.notes or 'Payment not received in bank account'}. Please re-submit a valid 12-digit UPI reference.",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )
        return {
            "success": True,
            "message": f"Payment for order {order.order_number} rejected.",
            "status": order.status,
            "payment_verified": False
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve' or 'reject'.")


# ---------------------------------------------------------------------------
# 1-on-1 Meeting Schedules Management for Mentor / Admin
# ---------------------------------------------------------------------------

class UpdateMeetingRequest(BaseModel):
    status: Optional[str] = None  # "completed", "cancelled", "rescheduled", "scheduled"
    scheduled_at: Optional[datetime] = None
    meeting_url: Optional[str] = None
    mentor_notes: Optional[str] = None
    recording_url: Optional[str] = None


class AdminScheduleMeetingRequest(BaseModel):
    order_id: int
    scheduled_at: datetime
    topic: Optional[str] = "1-on-1 Code Walkthrough & Project Viva Mentorship"
    meeting_url: Optional[str] = None


@router.get("/meetings")
def get_admin_meetings(
    status: Optional[str] = Query("all"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.models.walkthrough_session import WalkthroughSession

    # 1. Backfill: auto-create WalkthroughSession for legacy orders that had walkthrough_scheduled_at
    try:
        legacy_orders = db.query(Order).filter(
            Order.walkthrough_scheduled_at.isnot(None)
        ).all()
        for lo in legacy_orders:
            existing = db.query(WalkthroughSession).filter(
                WalkthroughSession.order_id == lo.id,
                WalkthroughSession.scheduled_at == lo.walkthrough_scheduled_at
            ).first()
            if not existing:
                new_s = WalkthroughSession(
                    order_id=lo.id,
                    student_id=lo.student_id,
                    session_number=lo.walkthrough_count or 1,
                    topic="1-on-1 Code Walkthrough & Viva Prep",
                    scheduled_at=lo.walkthrough_scheduled_at,
                    duration_minutes=30,
                    meeting_url=lo.walkthrough_meeting_url or f"https://meet.jit.si/CampusGig-Walkthrough-{lo.order_number}",
                    status="completed" if lo.status == "completed" else "scheduled"
                )
                db.add(new_s)
        db.commit()
    except Exception as e:
        db.rollback()

    # 2. Query all sessions
    query = db.query(WalkthroughSession)
    if status and status != "all":
        query = query.filter(WalkthroughSession.status == status)

    sessions = query.order_by(WalkthroughSession.scheduled_at.desc()).all()

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)

    result = []
    upcoming_count = 0
    today_count = 0
    completed_count = 0

    for s in sessions:
        order = s.order
        student = s.student or (order.student if order else None)

        is_today = today_start <= s.scheduled_at < today_end
        is_upcoming = s.scheduled_at >= now and s.status == "scheduled"
        if is_upcoming:
            upcoming_count += 1
        if is_today and s.status == "scheduled":
            today_count += 1
        if s.status == "completed":
            completed_count += 1

        result.append({
            "id": s.id,
            "order_id": s.order_id,
            "order_number": order.order_number if order else f"CG-ORD-{s.order_id}",
            "project_title": order.project_title if order else "Capstone Project",
            "order_status": order.status if order else "unknown",
            "student_id": s.student_id,
            "student_name": student.full_name if student else "Student",
            "student_email": student.email if student else "",
            "student_phone": getattr(student, "phone", "") or "",
            "session_number": s.session_number or 1,
            "topic": s.topic or "Code Walkthrough & Viva Prep",
            "scheduled_at": s.scheduled_at.isoformat(),
            "duration_minutes": s.duration_minutes or 30,
            "meeting_url": s.meeting_url,
            "status": s.status,
            "mentor_notes": s.mentor_notes,
            "recording_url": s.recording_url,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "is_today": is_today,
            "is_upcoming": is_upcoming
        })

    return {
        "meetings": result,
        "total_count": len(result),
        "upcoming_count": upcoming_count,
        "today_count": today_count,
        "completed_count": completed_count
    }


@router.put("/meetings/{session_id}")
def update_admin_meeting(
    session_id: int,
    req: UpdateMeetingRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.models.walkthrough_session import WalkthroughSession
    from app.services.notification_service import create_notification

    session = db.query(WalkthroughSession).filter(WalkthroughSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Meeting session not found")

    order = session.order

    if req.status:
        session.status = req.status
    if req.scheduled_at:
        session.scheduled_at = req.scheduled_at
        if order:
            order.walkthrough_scheduled_at = req.scheduled_at
    if req.meeting_url:
        session.meeting_url = req.meeting_url
        if order:
            order.walkthrough_meeting_url = req.meeting_url
    if req.mentor_notes is not None:
        session.mentor_notes = req.mentor_notes
    if req.recording_url is not None:
        session.recording_url = req.recording_url

    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    # Notifications to Student
    if order and req.status == "completed":
        create_notification(
            db=db,
            user_id=session.student_id,
            title="1-on-1 Walkthrough Session Completed 🎉",
            message=f"Your walkthrough session for {order.order_number} has been conducted and marked complete by your mentor. Check your order room for any mentor notes or recording.",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )
    elif order and req.scheduled_at:
        formatted_time = req.scheduled_at.strftime("%b %d, %Y at %I:%M %p")
        create_notification(
            db=db,
            user_id=session.student_id,
            title="Walkthrough Session Rescheduled 📅",
            message=f"Mentor updated your 1-on-1 walkthrough session for {order.order_number} to {formatted_time}. Join via updated Meet link.",
            order_id=order.id,
            channel="whatsapp",
            action_url=session.meeting_url
        )

    return {
        "success": True,
        "message": f"Session #{session.id} updated successfully",
        "meeting": {
            "id": session.id,
            "status": session.status,
            "scheduled_at": session.scheduled_at.isoformat(),
            "meeting_url": session.meeting_url,
            "mentor_notes": session.mentor_notes,
            "recording_url": session.recording_url
        }
    }


@router.post("/meetings/schedule")
def admin_schedule_meeting(
    req: AdminScheduleMeetingRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.models.walkthrough_session import WalkthroughSession
    from app.services.notification_service import create_notification
    import uuid

    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    meeting_url = req.meeting_url or f"https://meet.jit.si/CampusGig-Walkthrough-{order.order_number}-{uuid.uuid4().hex[:6]}"

    order.walkthrough_count = (order.walkthrough_count or 0) + 1
    order.walkthrough_scheduled_at = req.scheduled_at
    order.walkthrough_meeting_url = meeting_url

    session = WalkthroughSession(
        order_id=order.id,
        student_id=order.student_id,
        session_number=order.walkthrough_count,
        topic=req.topic or "1-on-1 Code Walkthrough & Project Viva Mentorship",
        scheduled_at=req.scheduled_at,
        duration_minutes=30,
        meeting_url=meeting_url,
        status="scheduled"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    formatted_time = req.scheduled_at.strftime("%b %d, %Y at %I:%M %p")
    create_notification(
        db=db,
        user_id=order.student_id,
        title="Mentor Scheduled 1-on-1 Walkthrough 🎥",
        message=f"Mentor scheduled a 1-on-1 walkthrough for {order.order_number} on {formatted_time}. Click to join meeting room.",
        order_id=order.id,
        channel="whatsapp",
        action_url=meeting_url
    )

    return {
        "success": True,
        "message": f"Walkthrough session scheduled for {order.order_number}",
        "meeting_id": session.id,
        "meeting_url": meeting_url,
        "scheduled_at": req.scheduled_at.isoformat()
    }


class ResetDatabaseRequest(BaseModel):
    secret_key: Optional[str] = None


@router.post("/reset-all-student-data")
def reset_all_student_data(
    req: ResetDatabaseRequest = None,
    db: Session = Depends(get_db)
):
    key = req.secret_key if req else None
    if key != "CAMPUSGIG_FRESH_START_2026":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid or missing administrative reset secret key."
        )

    try:
        # 1. Purge all dependent transactional records across all tables & coupons
        db.query(PaymentSubmission).delete(synchronize_session=False)
        db.query(WalkthroughSession).delete(synchronize_session=False)
        db.query(ChatMessage).delete(synchronize_session=False)
        db.query(OrderAttachment).delete(synchronize_session=False)
        db.query(OrderGroupMember).delete(synchronize_session=False)
        db.query(Notification).delete(synchronize_session=False)
        db.query(CourseEnrollment).delete(synchronize_session=False)
        db.query(Order).delete(synchronize_session=False)
        db.query(Coupon).delete(synchronize_session=False)

        # 2. Delete all users except DattaHadke
        db.query(User).filter(User.username != "DattaHadke").delete(synchronize_session=False)

        # 3. Ensure primary clean admin account DattaHadke exists and has guaranteed credentials
        admin_pass = "Datta@123"
        hashed_pw = hash_password(admin_pass)

        admin_user = db.query(User).filter(User.username == "DattaHadke").first()
        if admin_user:
            admin_user.email = "hadkedattatray487@gmail.com"
            admin_user.full_name = "Datta Hadke"
            admin_user.role = "admin"
            admin_user.hashed_password = hashed_pw
            admin_user.is_active = True
            admin_user.is_online = False
            admin_user.wallet_balance = 0.0
            admin_user.student_type = None
            admin_user.phone = "7020209079"
        else:
            admin_user = User(
                email="hadkedattatray487@gmail.com",
                username="DattaHadke",
                full_name="Datta Hadke",
                role="admin",
                hashed_password=hashed_pw,
                phone="7020209079",
                is_active=True,
                is_online=False,
                wallet_balance=0.0
            )
            db.add(admin_user)

        # 4. Remove any duplicate or secondary admin accounts
        db.query(User).filter(User.role == "admin", User.username != "DattaHadke").delete(synchronize_session=False)

        # 5. Ensure Machine Learning pricing is set to 1500
        ml_config = db.query(PricingConfig).filter(PricingConfig.category_key == "college_ml").first()
        if ml_config:
            ml_config.base_price = 1500.0

        db.commit()

        # Delete any temporary deliverable files
        if os.path.exists(UPLOAD_DIR_DELIVERABLES):
            for filename in os.listdir(UPLOAD_DIR_DELIVERABLES):
                file_path = os.path.join(UPLOAD_DIR_DELIVERABLES, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception:
                    pass

        return {
            "status": "success",
            "message": "All student accounts, orders, chats, attachments, payments, meeting sessions, and coupons have been permanently wiped. Sole admin DattaHadke is active. ML base price is 1500.",
            "admin_credentials": {
                "username": "DattaHadke",
                "email": "hadkedattatray487@gmail.com",
                "role": "admin"
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database purge failed: {str(e)}")




