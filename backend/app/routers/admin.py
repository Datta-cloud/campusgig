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
from app.models.order import Order
from app.models.user import User
from app.models.pricing import PricingConfig
from app.models.attachment import OrderAttachment
from app.services.auth_service import require_admin
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

    file_url = f"http://127.0.0.1:8001/uploads/deliverables/{safe_filename}"
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

    if req.action == "approve":
        order.status = "advance_paid"
        order.payment_verified = True
        order.advance_paid_at = datetime.utcnow()
        if req.notes:
            order.admin_notes = req.notes
        db.commit()
        db.refresh(order)

        create_notification(
            db=db,
            user_id=order.student_id,
            title="Payment Verified & Development Started! 🚀",
            message=f"Your advance payment (UTR: {order.utr_number}) for {order.order_number} has been verified in our bank account. Development is in progress!",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )
        return {
            "success": True,
            "message": f"Payment for order {order.order_number} verified and approved.",
            "status": order.status,
            "payment_verified": True
        }
    elif req.action == "reject":
        bad_utr = order.utr_number
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
            message=f"Transaction UTR {bad_utr} could not be matched with our bank statement. Reason: {req.notes or 'Payment not received in bank account'}. Please re-submit a valid 12-digit UPI reference.",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )
        return {
            "success": True,
            "message": f"Payment for order {order.order_number} rejected. Order returned to pending payment.",
            "status": order.status,
            "payment_verified": False
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve' or 'reject'.")



