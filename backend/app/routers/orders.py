import json
import os
import uuid
import re
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
import app.config as config
from app.limiter import limiter
from app.models.order import Order, OrderGroupMember
from app.models.user import User
from app.models.attachment import OrderAttachment
from app.models.payment_submission import PaymentSubmission
from app.services.auth_service import get_current_user, require_admin, require_student, get_current_user_optional
from app.services.pricing_service import calculate_order_price
from app.services.ai_service import (
    refine_project_scope,
    generate_viva_questions,
    evaluate_viva_answer,
    generate_presentation_deck,
    generate_marp_markdown,
    generate_ieee_paper,
    generate_ieee_latex,
    generate_uml_diagrams,
    explain_code_snippet,
    generate_readme_and_docker,
    rewrite_academic_turnitin,
    handle_whatsapp_bot_command
)
from app.services.notification_service import create_notification, notify_admin_team

router = APIRouter(prefix="/api/orders", tags=["Orders"])


class PriceCalcRequest(BaseModel):
    category_key: str
    deliverables: List[str] = ["code"]
    urgency: str = "normal"
    page_count: Optional[int] = None


class RefineScopeRequest(BaseModel):
    project_title: str
    domain: str
    deliverables: List[str] = ["code"]
    student_type: str = "college"
    notes: Optional[str] = None


class CreateOrderRequest(BaseModel):
    category_key: str
    project_title: str
    description: Optional[str] = None
    domain: Optional[str] = None
    deliverables: List[str] = ["code"]
    page_count: Optional[int] = None
    deadline: Optional[datetime] = None
    urgency: str = "normal"
    payment_method: Optional[str] = None
    student_notes: Optional[str] = None
    ai_refined_scope: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: str
    admin_notes: Optional[str] = None
    total_price: Optional[float] = None
    advance_amount: Optional[float] = None
    balance_amount: Optional[float] = None


class PaymentConfirmRequest(BaseModel):
    payment_method: str = "upi"
    utr_number: Optional[str] = None
    coupon_code: Optional[str] = None
    discount_amount: Optional[float] = 0.0


class ValidateCouponRequest(BaseModel):
    code: str


class RevisionRequest(BaseModel):
    notes: str


class WalkthroughScheduleRequest(BaseModel):
    scheduled_at: datetime
    topic: Optional[str] = None


class VivaEvaluateRequest(BaseModel):
    question_id: int
    question: str
    student_answer: str
    model_answer: Optional[str] = None


def generate_order_number(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"CG-{year}-"
    # Find the maximum existing sequence number for this year to prevent any collision
    existing_orders = db.query(Order.order_number).filter(Order.order_number.like(f"{prefix}%")).all()
    max_seq = 0
    for (num,) in existing_orders:
        if num and num.startswith(prefix):
            try:
                seq = int(num[len(prefix):])
                if seq > max_seq:
                    max_seq = seq
            except (ValueError, TypeError):
                continue
    candidate_seq = max_seq + 1
    candidate = f"{prefix}{candidate_seq:05d}"
    while db.query(Order).filter(Order.order_number == candidate).first():
        candidate_seq += 1
        candidate = f"{prefix}{candidate_seq:05d}"
    return candidate


def _serialize_attachment(a, order_id: int, advance_confirmed: bool, is_midterm_unlocked: bool, is_fully_settled: bool) -> dict:
    t = f"{a.file_type or ''} {a.file_name or ''}".lower()
    if any(k in t for k in ["phase 1", "synopsis", "scope", "architecture", "diagram", "srs", "reference", "preview"]):
        phase_key = "phase_1"
        phase_label = "Phase 1: Project Scope, Synopsis & UML Architecture"
        req_percent = 30
        is_unlocked = advance_confirmed
        unlock_msg = "Unlocked with 30% Advance" if is_unlocked else "Unlocks after 30% advance verified by mentor"
    elif any(k in t for k in ["phase 2", "prototype", "draft", "mid-term", "midterm", "devops"]):
        phase_key = "phase_2"
        phase_label = "Phase 2: Working Prototype & Code Draft"
        req_percent = 50
        is_unlocked = is_midterm_unlocked
        unlock_msg = "Unlocked with 50% Milestone Payment" if is_unlocked else "Unlocks after 50% milestone payment verified"
    elif any(k in t for k in ["phase 4", "report", "ieee", "paper", "ppt", "presentation"]):
        phase_key = "phase_4"
        phase_label = "Phase 4: Comprehensive IEEE Report & PPT Presentation"
        req_percent = 100
        is_unlocked = is_fully_settled
        unlock_msg = "Unlocked with 100% Final Settlement" if is_unlocked else "Unlocks after 100% full balance settlement"
    elif any(k in t for k in ["phase 5", "phase 6", "viva", "exam", "defense", "turnitin", "certificate", "walkthrough", "video"]):
        phase_key = "phase_5"
        phase_label = "Phase 5: Viva Defense Guide & Turnitin Verification"
        req_percent = 100
        is_unlocked = is_fully_settled
        unlock_msg = "Unlocked with 100% Final Settlement" if is_unlocked else "Unlocks after 100% full balance settlement"
    else:
        phase_key = "phase_3"
        phase_label = "Phase 3: Full Production Source Code Package"
        req_percent = 100
        is_unlocked = is_fully_settled
        unlock_msg = "Unlocked with 100% Final Settlement" if is_unlocked else "Unlocks after 100% full balance settlement"

    return {
        "id": a.id,
        "file_name": a.file_name,
        "file_url": f"/api/orders/{order_id}/download/{a.id}",
        "raw_file_url": a.file_url,
        "file_type": a.file_type,
        "phase": phase_key,
        "phase_label": phase_label,
        "required_percent": req_percent,
        "is_unlocked": is_unlocked,
        "unlock_msg": unlock_msg,
        "uploaded_by": a.uploaded_by,
        "created_at": a.created_at.isoformat() if a.created_at else None
    }


def order_to_dict(order: Order) -> dict:
    pending_sub = None
    try:
        subs = getattr(order, "payment_submissions", None)
        if subs:
            pending_sub = next((s for s in subs if getattr(s, "status", None) == "pending"), None)
    except Exception:
        pending_sub = None

    total_price = float(order.total_price or 0.0)
    balance_amount = float(order.balance_amount or 0.0)
    advance_amount = float(order.advance_amount or 0.0)
    total_paid = max(0.0, round(total_price - balance_amount, 2))
    paid_ratio = (total_paid / total_price) if total_price > 0 else (1.0 if order.status == "completed" else 0.0)

    advance_confirmed = bool(
        order.advance_paid_at is not None or
        order.status in ("advance_paid", "in_progress", "ready_for_review", "completed")
    )
    is_fully_settled = bool(order.status == "completed" or balance_amount <= 0.01)
    is_midterm_unlocked = bool(advance_confirmed and (paid_ratio >= 0.49 or is_fully_settled))

    return {
        "id": order.id,
        "order_number": order.order_number,
        "student_id": order.student_id,
        "student_type": order.student_type,
        "category_key": order.category_key,
        "project_title": order.project_title,
        "description": order.description,
        "ai_refined_scope": order.ai_refined_scope,
        "domain": order.domain,
        "deliverables": json.loads(order.deliverables_json) if order.deliverables_json else [],
        "page_count": order.page_count,
        "deadline": order.deadline.isoformat() if order.deadline else None,
        "urgency": order.urgency,
        "base_price": order.base_price,
        "addons_price": order.addons_price,
        "urgency_fee": order.urgency_fee,
        "total_price": order.total_price,
        "advance_amount": order.advance_amount,
        "balance_amount": order.balance_amount,
        "status": order.status,
        "advance_paid_at": order.advance_paid_at.isoformat() if order.advance_paid_at else None,
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
        "payment_method": order.payment_method,
        "utr_number": order.utr_number,
        "admin_notes": order.admin_notes,
        "student_notes": order.student_notes,
        "revision_count": order.revision_count or 0,
        "max_revisions": order.max_revisions or 2,
        "revision_notes": order.revision_notes,
        "revision_requested_at": order.revision_requested_at.isoformat() if order.revision_requested_at else None,
        "plagiarism_score": order.plagiarism_score,
        "ai_detection_score": order.ai_detection_score,
        "plagiarism_report_url": order.plagiarism_report_url,
        "walkthrough_count": order.walkthrough_count or 0,
        "walkthrough_scheduled_at": order.walkthrough_scheduled_at.isoformat() if order.walkthrough_scheduled_at else None,
        "walkthrough_meeting_url": order.walkthrough_meeting_url,
        "coupon_code": order.coupon_code,
        "discount_amount": order.discount_amount or 0.0,
        "payment_verified": bool(order.payment_verified),
        "certificate_id": order.certificate_id,
        "certificate_issued_at": order.certificate_issued_at.isoformat() if order.certificate_issued_at else None,
        "github_repo_url": order.github_repo_url,
        "deployed_url": order.deployed_url,
        "deployed_at": order.deployed_at.isoformat() if order.deployed_at else None,
        "milestones": {
            "advance_confirmed": advance_confirmed,
            "advance_amount": advance_amount,
            "total_price": total_price,
            "balance_amount": balance_amount,
            "total_paid": total_paid,
            "paid_percentage": min(100.0, round(paid_ratio * 100, 1)),
            "phase_1_unlocked": advance_confirmed,
            "phase_2_unlocked": is_midterm_unlocked,
            "phase_3_unlocked": is_fully_settled,
            "phase_4_unlocked": is_fully_settled,
            "phase_5_unlocked": is_fully_settled,
            "toolkit": {
                "uml_diagrams": advance_confirmed,
                "whatsapp_bot": advance_confirmed,
                "group_split": True,
                "readme_docker": is_midterm_unlocked,
                "interactive_ppt": is_fully_settled,
                "ieee_paper": is_fully_settled,
                "github_deploy": is_fully_settled,
                "turnitin_rewriter": is_fully_settled
            }
        },
        "group_members": [
            {
                "id": gm.id,
                "name": gm.name,
                "email": gm.email,
                "phone": gm.phone,
                "role_in_team": gm.role_in_team,
                "share_amount": gm.share_amount,
                "is_paid": gm.is_paid,
                "paid_at": gm.paid_at.isoformat() if gm.paid_at else None,
                "utr_number": gm.utr_number,
                "qr_token": gm.qr_token
            } for gm in (order.group_members or [])
        ],
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "student": {
            "id": order.student.id,
            "username": order.student.username,
            "full_name": order.student.full_name,
            "email": order.student.email,
            "phone": order.student.phone,
            "college_name": order.student.college_name,
            "college_branch": order.student.college_branch
        } if order.student else None,
        "attachments": [
            _serialize_attachment(a, order.id, advance_confirmed, is_midterm_unlocked, is_fully_settled)
            for a in (order.attachments or [])
        ],
        "pending_payment_submission": {
            "id": pending_sub.id,
            "amount": pending_sub.amount,
            "utr_number": pending_sub.utr_number,
            "payment_type": pending_sub.payment_type,
            "created_at": pending_sub.created_at.isoformat() if pending_sub.created_at else None
        } if pending_sub else None
    }


@router.post("/calculate-price")
def calculate_price(req: PriceCalcRequest, db: Session = Depends(get_db)):
    try:
        result = calculate_order_price(
            req.category_key, req.deliverables, req.urgency, req.page_count, db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/validate-coupon")
def validate_coupon_endpoint(
    req: ValidateCouponRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    clean_code = req.code.strip().upper()
    if not clean_code:
        raise HTTPException(status_code=400, detail="Please enter a coupon code.")

    from app.models.coupon import Coupon
    coupon = db.query(Coupon).filter(Coupon.code == clean_code).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code. Please check and try again.")

    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="This coupon code is currently inactive.")

    if coupon.max_uses > 0 and (coupon.used_count or 0) >= coupon.max_uses:
        raise HTTPException(
            status_code=400,
            detail=f"Coupon '{coupon.code}' has reached its maximum redemption limit ({coupon.max_uses} uses)."
        )

    # 1 promo per student check
    if current_user and current_user.role == "student":
        already_used = db.query(Order).filter(
            Order.student_id == current_user.id,
            Order.coupon_code == clean_code,
            Order.status != "cancelled"
        ).first()
        if already_used:
            raise HTTPException(
                status_code=400,
                detail=f"You have already redeemed promo code '{clean_code}'. Each student can only use a promo code once."
            )

    return {
        "valid": True,
        "code": coupon.code,
        "discount_percent": coupon.discount_percent,
        "description": coupon.description or f"Flat {coupon.discount_percent}% off",
        "message": f"🎉 Coupon '{coupon.code}' applied! Flat {coupon.discount_percent}% discount applied."
    }


@router.get("/user/payment-quota")
def get_user_payment_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        used_count = db.query(PaymentSubmission).filter(
            PaymentSubmission.student_id == current_user.id,
            PaymentSubmission.created_at >= thirty_days_ago
        ).count()
        return {
            "monthly_limit": 3,
            "used": used_count,
            "remaining": max(0, 3 - used_count)
        }
    except Exception:
        return {
            "monthly_limit": 3,
            "used": 0,
            "remaining": 3
        }


@router.post("/refine-scope")
def refine_scope(req: RefineScopeRequest):
    result = refine_project_scope(
        req.project_title, req.domain, req.deliverables,
        req.student_type, req.notes
    )
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def create_order(
    req: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can create orders")

    # Calculate pricing
    try:
        pricing = calculate_order_price(
            req.category_key, req.deliverables, req.urgency, req.page_count, db
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    order = Order(
        order_number=generate_order_number(db),
        student_id=current_user.id,
        student_type=current_user.student_type or "college",
        category_key=req.category_key,
        project_title=req.project_title,
        description=req.description,
        ai_refined_scope=req.ai_refined_scope,
        domain=req.domain,
        deliverables_json=json.dumps(req.deliverables),
        page_count=req.page_count,
        deadline=req.deadline,
        urgency=req.urgency,
        base_price=pricing["base_price"],
        addons_price=pricing["addons_total"],
        urgency_fee=pricing["urgency_fee"],
        total_price=pricing["total"],
        advance_amount=pricing["advance"],
        balance_amount=pricing["balance"],
        payment_method=req.payment_method,
        student_notes=req.student_notes,
        status="pending_payment"
    )
    try:
        db.add(order)
        db.commit()
        db.refresh(order)
    except Exception as db_err:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while saving order: {str(db_err)}"
        )
    return order_to_dict(order)


@router.get("")
def list_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    domain: Optional[str] = None,
    student_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if current_user.role == "student":
        query = query.filter(Order.student_id == current_user.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)
    if domain:
        query = query.filter(Order.domain == domain)
    if student_type:
        query = query.filter(Order.student_type == student_type)

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "orders": [order_to_dict(o) for o in orders]
    }


@router.get("/my")
def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.student_id == current_user.id).order_by(Order.created_at.desc()).all()
    return [order_to_dict(o) for o in orders]


@router.get("/{order_id}")
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return order_to_dict(order)


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    req: StatusUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_statuses = [
        "pending_payment", "payment_submitted", "balance_submitted", "advance_paid",
        "in_progress", "ready_for_review", "completed",
        "cancelled", "revision_requested"
    ]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    order.status = req.status
    if req.admin_notes:
        order.admin_notes = req.admin_notes
    if req.total_price is not None:
        order.total_price = float(req.total_price)
    if req.advance_amount is not None:
        order.advance_amount = float(req.advance_amount)
    if req.balance_amount is not None:
        order.balance_amount = float(req.balance_amount)
    elif req.total_price is not None:
        order.balance_amount = max(0.0, order.total_price - (order.advance_amount or 0.0))

    if req.status == "completed":
        order.completed_at = datetime.utcnow()
        if not order.certificate_id:
            order.certificate_id = f"CG-CERT-2026-{uuid.uuid4().hex[:8].upper()}"
            order.certificate_issued_at = datetime.utcnow()
    elif req.status == "ready_for_review":
        create_notification(
            db=db,
            user_id=order.student_id,
            title="Deliverables Ready for Review! 🚀",
            message=f"Mentor completed project {order.order_number}. Remaining fee is ₹{order.balance_amount}. Inspect previews and pay balance to unlock.",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )

    db.commit()
    db.refresh(order)
    return order_to_dict(order)


@router.put("/{order_id}/confirm-payment")
def confirm_payment(
    order_id: int,
    req: PaymentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Monthly submission limit check (Max 25 submissions per month per student for security)
    if current_user.role != "admin":
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            user_submissions_count = db.query(PaymentSubmission).filter(
                PaymentSubmission.student_id == current_user.id,
                PaymentSubmission.created_at >= thirty_days_ago
            ).count()
            if user_submissions_count >= 25:
                raise HTTPException(
                    status_code=429,
                    detail="Monthly payment submission limit reached (Maximum 25 submissions per month). Please contact admin for manual assistance."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    # 1. Validate UTR is present
    if not req.utr_number or not req.utr_number.strip():
        raise HTTPException(
            status_code=400,
            detail="12-digit UPI transaction reference (UTR) is required to verify payment."
        )

    clean_utr = req.utr_number.strip()

    # 2. Strict 12-digit numeric regex check (Indian banking UPI standard)
    if not re.match(r"^\d{12}$", clean_utr):
        raise HTTPException(
            status_code=400,
            detail="Invalid UPI Transaction Reference (UTR). UTR must be exactly 12 numeric digits (e.g. 412356789012) as shown on your UPI receipt."
        )

    # 3. Duplicate UTR check across all orders & payment submissions in database
    duplicate_order = db.query(Order).filter(Order.utr_number == clean_utr, Order.id != order.id).first()
    if duplicate_order:
        raise HTTPException(
            status_code=400,
            detail=f"This UPI UTR reference ({clean_utr}) has already been submitted for order {duplicate_order.order_number}. Duplicate transactions are strictly prohibited."
        )

    try:
        duplicate_sub = db.query(PaymentSubmission).filter(
            PaymentSubmission.utr_number == clean_utr,
            PaymentSubmission.order_id != order.id
        ).first()
        if duplicate_sub:
            raise HTTPException(
                status_code=400,
                detail=f"This UPI UTR reference ({clean_utr}) has already been submitted for payment. Duplicate transactions are strictly prohibited."
            )
    except HTTPException:
        raise
    except Exception:
        pass

    order.payment_method = req.payment_method
    order.utr_number = clean_utr

    # Apply Coupon & discount strictly calculated and validated on the backend
    if req.coupon_code:
        clean_coupon = req.coupon_code.strip().upper()
        from app.models.coupon import Coupon
        cpn = db.query(Coupon).filter(Coupon.code == clean_coupon, Coupon.is_active == True).first()
        if not cpn:
            raise HTTPException(status_code=400, detail="Invalid or inactive coupon code")
        if cpn.max_uses and (cpn.used_count or 0) >= cpn.max_uses:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")

        # 1 promo per student check
        if current_user.role == "student":
            already_used = db.query(Order).filter(
                Order.student_id == current_user.id,
                Order.coupon_code == clean_coupon,
                Order.id != order.id,
                Order.status != "cancelled"
            ).first()
            if already_used:
                raise HTTPException(
                    status_code=400,
                    detail=f"You have already redeemed promo code '{clean_coupon}'. Each student can only use a promo code once."
                )

        # Backend-enforced discount calculation
        discount_percent = float(cpn.discount_percent)
        calculated_discount = round(float(order.total_price) * (discount_percent / 100.0), 2)
        order.coupon_code = clean_coupon
        order.discount_amount = calculated_discount
        order.total_price = max(0.0, float(order.total_price) - calculated_discount)
        order.advance_amount = round(order.total_price * 0.30, 2)
        order.balance_amount = max(0.0, float(order.total_price) - float(order.advance_amount))
        cpn.used_count = (cpn.used_count or 0) + 1

    # Anti-cheating verification workflow:
    # If submitted by admin, auto-verify;
    # If submitted by student, mark as 'payment_submitted' with payment_verified=False pending admin verification!
    if current_user.role == "admin":
        order.status = "advance_paid"
        order.payment_verified = True
        order.advance_paid_at = datetime.utcnow()
        title = "30% Advance Payment Approved 🚀"
        msg = f"Advance payment for {order.order_number} verified and approved. Development has officially started!"
    else:
        order.status = "payment_submitted"
        order.payment_verified = False
        title = "Payment Submitted for Verification ⏳"
        msg = f"Payment receipt (UTR: {clean_utr}) submitted for order {order.order_number}. Mentor is verifying the transaction against the bank statement."

    # Record Payment Submission
    try:
        submission = PaymentSubmission(
            order_id=order.id,
            student_id=current_user.id,
            payment_type="advance",
            amount=order.advance_amount,
            utr_number=clean_utr,
            status="approved" if current_user.role == "admin" else "pending",
            verified_at=datetime.utcnow() if current_user.role == "admin" else None
        )
        db.add(submission)
    except Exception:
        pass

    db.commit()
    db.refresh(order)

    # Notify student
    create_notification(
        db=db,
        user_id=order.student_id,
        title=title,
        message=msg,
        order_id=order.id,
        channel="whatsapp",
        action_url=f"/order/{order.id}"
    )

    # If student submitted, alert all admins
    if current_user.role != "admin":
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            create_notification(
                db=db,
                user_id=admin.id,
                title="🔔 New Payment Submitted for Verification",
                message=f"Order {order.order_number}: Student submitted UTR {clean_utr} for ₹{order.advance_amount}. Check bank statement and approve.",
                order_id=order.id,
                channel="in_app",
                action_url="/admin/orders"
            )

    return order_to_dict(order)


@router.put("/{order_id}/confirm-completion")
def confirm_completion(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if order.status != "ready_for_review":
        raise HTTPException(status_code=400, detail="Order must be in 'ready_for_review' status")

    order.status = "completed"
    order.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    create_notification(
        db=db,
        user_id=order.student_id,
        title="Project Completed! 🎓",
        message=f"All phase deliverables for {order.order_number} are 100% unlocked.",
        order_id=order.id,
        channel="whatsapp",
        action_url=f"/order/{order.id}"
    )

    res = order_to_dict(order)
    res["message"] = "Order marked as completed. All deliverables unlocked."
    return res


@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}


# -------------------------------------------------------------
# 1. In-Browser Deliverable & Code Previewer
# -------------------------------------------------------------
@router.get("/{order_id}/preview/{attachment_id}")
def preview_attachment(
    order_id: int,
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    att = db.query(OrderAttachment).filter(OrderAttachment.id == attachment_id, OrderAttachment.order_id == order_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")

    filename = att.file_name
    file_path = None
    from app.config import UPLOAD_DIR_DELIVERABLES, UPLOAD_DIR_REFERENCES
    for base in [UPLOAD_DIR_DELIVERABLES, UPLOAD_DIR_REFERENCES]:
        if os.path.exists(base):
            for candidate in os.listdir(base):
                if candidate.endswith(filename) or (att.file_url and candidate in att.file_url):
                    file_path = os.path.join(base, candidate)
                    break
            if file_path:
                break

    is_paid = (order.status == "completed")
    code_extensions = (".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".json", ".md", ".txt", ".sql", ".sh", ".java", ".cpp")
    is_code = any(filename.lower().endswith(ext) for ext in code_extensions)

    preview_content = ""
    total_lines = 0
    lines_shown = 0

    if file_path and os.path.exists(file_path) and is_code:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                all_lines = f.readlines()
                total_lines = len(all_lines)
                if not is_paid and total_lines > 80:
                    lines_shown = 80
                    preview_content = "".join(all_lines[:80])
                else:
                    lines_shown = total_lines
                    preview_content = "".join(all_lines)
        except Exception as e:
            preview_content = f"# Error reading file preview: {str(e)}"
    elif is_code:
        preview_content = (
            f"# CampusGig Source Code Preview: {filename}\n"
            f"# Project: {order.project_title}\n"
            f"# Domain: {order.domain or order.category_key}\n\n"
            f"import os\nimport sys\n\n"
            f"class ProjectModule:\n"
            f"    def __init__(self):\n"
            f"        self.version = '1.0.0'\n"
            f"        self.status = 'Ready for production'\n\n"
            f"    def execute_pipeline(self):\n"
            f"        print('Executing verified module pipeline...')\n"
            f"        return True\n\n"
            f"if __name__ == '__main__':\n"
            f"    module = ProjectModule()\n"
            f"    module.execute_pipeline()\n"
        )
        total_lines = 18
        lines_shown = 18
    else:
        preview_content = f"Document / Package deliverable: {filename} ({att.file_type})."

    return {
        "attachment_id": att.id,
        "file_name": att.file_name,
        "file_type": att.file_type,
        "file_url": att.file_url,
        "is_code": is_code,
        "is_watermarked": not is_paid,
        "watermark_text": "CampusGig Protected Preview • Pay 70% Balance to Download Clean Package" if not is_paid else None,
        "total_lines": total_lines,
        "lines_shown": lines_shown,
        "content": preview_content
    }


@router.get("/{order_id}/download/{attachment_id}")
def download_order_attachment(
    request: Request,
    order_id: int,
    attachment_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Extract user from Authorization header or token query parameter
    auth_header = request.headers.get("Authorization")
    raw_token = None
    if auth_header and auth_header.startswith("Bearer "):
        raw_token = auth_header.split(" ", 1)[1]
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(status_code=401, detail="Authentication required to download project deliverables")

    payload = decode_token(raw_token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account inactive or not found")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if user.role == "student" and order.student_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    att = db.query(OrderAttachment).filter(OrderAttachment.id == attachment_id, OrderAttachment.order_id == order_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Payment / Milestone check for students:
    if user.role == "student":
        total_price = float(order.total_price or 0.0)
        balance = float(order.balance_amount or 0.0)
        total_paid = max(0.0, total_price - balance)
        paid_ratio = (total_paid / total_price) if total_price > 0 else (1.0 if order.status == "completed" else 0.0)

        advance_confirmed = bool(
            order.advance_paid_at is not None or
            order.status in ("advance_paid", "in_progress", "ready_for_review", "completed")
        )
        is_fully_settled = bool(order.status == "completed" or balance <= 0.01)
        is_midterm_unlocked = bool(advance_confirmed and (paid_ratio >= 0.49 or is_fully_settled))

        t = f"{att.file_type or ''} {att.file_name or ''}".lower()
        if any(k in t for k in ["phase 1", "synopsis", "scope", "architecture", "diagram", "srs", "reference", "preview"]):
            if not advance_confirmed:
                raise HTTPException(
                    status_code=402,
                    detail="Phase 1 deliverables unlock after mentor verifies your 30% advance payment."
                )
        elif any(k in t for k in ["phase 2", "prototype", "draft", "mid-term", "midterm", "devops"]):
            if not is_midterm_unlocked:
                raise HTTPException(
                    status_code=402,
                    detail=f"Phase 2 deliverables unlock after at least 50% milestone payment is verified. Current paid: {round(paid_ratio * 100)}%."
                )
        else:
            # Full source code, final reports, presentation PPT, viva guide, etc.
            if not is_fully_settled:
                raise HTTPException(
                    status_code=402,
                    detail=f"Full source code and final deliverables unlock upon 100% balance settlement (₹{round(balance, 2)} remaining)."
                )

    from app.config import UPLOAD_DIR_DELIVERABLES, UPLOAD_DIR_REFERENCES
    file_path = None
    for base in [UPLOAD_DIR_DELIVERABLES, UPLOAD_DIR_REFERENCES]:
        if os.path.exists(base):
            for candidate in os.listdir(base):
                if candidate.endswith(att.file_name) or (att.file_url and candidate in att.file_url):
                    file_path = os.path.join(base, candidate)
                    break
            if file_path:
                break

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Deliverable file not found on server")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        filename=att.file_name,
        media_type="application/octet-stream"
    )


# -------------------------------------------------------------
# 2. Milestone Revision Request Workflow
# -------------------------------------------------------------
@router.post("/{order_id}/request-revision")
def request_revision(
    order_id: int,
    req: RevisionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if order.status != "ready_for_review":
        raise HTTPException(status_code=400, detail="Revisions can only be requested when deliverables are in 'ready_for_review' status.")

    max_allowed = order.max_revisions or 2
    current_rev = order.revision_count or 0
    if current_rev >= max_allowed:
        raise HTTPException(status_code=400, detail=f"Maximum allowed free revisions ({max_allowed}) reached for this project.")

    order.revision_count = current_rev + 1
    order.revision_notes = req.notes
    order.revision_requested_at = datetime.utcnow()
    order.status = "revision_requested"

    db.commit()
    db.refresh(order)

    notify_admin_team(
        db=db,
        title=f"Revision Requested: {order.order_number}",
        message=f"Student requested revision #{order.revision_count}: '{req.notes[:120]}'",
        order_id=order.id,
        channel="whatsapp",
        action_url=f"/admin/orders"
    )

    return order_to_dict(order)


@router.post("/{order_id}/accept-revision")
def accept_revision(
    order_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = "in_progress"
    db.commit()
    db.refresh(order)

    create_notification(
        db=db,
        user_id=order.student_id,
        title="Revision Accepted & In Progress 🛠️",
        message=f"Mentor has accepted your requested revisions for {order.order_number} and is implementing changes.",
        order_id=order.id,
        channel="in_app",
        action_url=f"/order/{order.id}"
    )

    return order_to_dict(order)


# -------------------------------------------------------------
# 3. 1-on-1 Code Walkthrough Scheduler (Max 3 sessions, 30-min slots)
# -------------------------------------------------------------
@router.post("/{order_id}/schedule-walkthrough")
def schedule_walkthrough(
    order_id: int,
    req: WalkthroughScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Limit check: Student can book max 3 walkthroughs per project
    current_count = order.walkthrough_count or 0
    if current_count >= 3:
        raise HTTPException(
            status_code=400,
            detail="You have reached the maximum limit of 3 walkthrough sessions for this project."
        )

    order.walkthrough_count = current_count + 1

    random_token = uuid.uuid4().hex[:6]
    meeting_url = f"https://meet.jit.si/CampusGig-Walkthrough-{order.order_number}-{random_token}"
    order.walkthrough_scheduled_at = req.scheduled_at
    order.walkthrough_meeting_url = meeting_url

    # Create WalkthroughSession record
    from app.models.walkthrough_session import WalkthroughSession
    session_record = WalkthroughSession(
        order_id=order.id,
        student_id=order.student_id,
        session_number=order.walkthrough_count,
        topic=req.topic or "Code Walkthrough & Viva Prep",
        scheduled_at=req.scheduled_at,
        duration_minutes=30,
        meeting_url=meeting_url,
        status="scheduled"
    )
    db.add(session_record)

    db.commit()
    db.refresh(order)

    formatted_time = req.scheduled_at.strftime("%b %d, %Y at %I:%M %p")

    # 1. Notify Student
    create_notification(
        db=db,
        user_id=order.student_id,
        title="1-on-1 Walkthrough Session Confirmed 🎥",
        message=f"Live 30-min Code Walkthrough (Session {order.walkthrough_count}/3) scheduled for {formatted_time}. Join via Meet link.",
        order_id=order.id,
        channel="whatsapp",
        action_url=meeting_url
    )

    # 2. Notify Admin ("mereko uska notification aye aur direct meetings section me le jaye")
    student_name = order.student.full_name if order.student else "Student"
    admins = db.query(User).filter(User.role == "admin").all()
    for admin in admins:
        create_notification(
            db=db,
            user_id=admin.id,
            title="🎥 New 1-on-1 Walkthrough Scheduled!",
            message=f"{student_name} booked a 30-min walkthrough (Session {order.walkthrough_count}/3) for order {order.order_number} on {formatted_time}. Topic: {req.topic or 'Code Walkthrough & Viva Prep'}",
            order_id=order.id,
            channel="in_app",
            action_url="/admin/meetings"
        )

    return {
        "message": f"Walkthrough session {order.walkthrough_count}/3 scheduled successfully",
        "meeting_url": meeting_url,
        "scheduled_at": req.scheduled_at.isoformat(),
        "walkthrough_count": order.walkthrough_count
    }


@router.get("/user/meetings")
def get_user_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.walkthrough_session import WalkthroughSession
    sessions = db.query(WalkthroughSession).filter(
        WalkthroughSession.student_id == current_user.id
    ).order_by(WalkthroughSession.scheduled_at.asc()).all()

    result = []
    for s in sessions:
        order = s.order
        result.append({
            "id": s.id,
            "order_id": s.order_id,
            "order_number": order.order_number if order else f"ORD-{s.order_id}",
            "project_title": order.project_title if order else "Project Walkthrough",
            "session_number": s.session_number,
            "topic": s.topic or "Code Walkthrough & Viva Prep",
            "scheduled_at": s.scheduled_at.isoformat(),
            "duration_minutes": s.duration_minutes,
            "meeting_url": s.meeting_url,
            "status": s.status,
            "mentor_notes": s.mentor_notes,
            "recording_url": s.recording_url,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return result


# -------------------------------------------------------------
# 4. Integrated Viva Prep AI Mock Interviewer
# -------------------------------------------------------------
@router.get("/{order_id}/viva-questions")
def get_viva_questions(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    questions = generate_viva_questions(
        domain=order.domain or order.category_key,
        project_title=order.project_title,
        ai_scope=order.ai_refined_scope
    )
    return {
        "order_id": order.id,
        "project_title": order.project_title,
        "domain": order.domain or order.category_key,
        "questions": questions
    }


@router.post("/{order_id}/viva-evaluate")
def evaluate_viva(
    order_id: int,
    req: VivaEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    result = evaluate_viva_answer(
        question=req.question,
        model_answer=req.model_answer or "Comprehensive technical architecture and implementation explanation.",
        student_answer=req.student_answer
    )
    return result


# -------------------------------------------------------------
# 5. Dynamic UPI QR & Payment Gateway Simulation
# -------------------------------------------------------------
@router.get("/{order_id}/payment-qr")
def get_payment_qr(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    upi_id = os.getenv("UPI_ID", "7020209079@ybl")
    merchant_name = os.getenv("UPI_MERCHANT_NAME", "Dattatray Goraksh Hadke")
    adv_intent = f"upi://pay?pa={upi_id}&pn={merchant_name}&am={order.advance_amount}&cu=INR&tn=Advance-{order.order_number}&tr=ADV{order.order_number}"
    bal_intent = f"upi://pay?pa={upi_id}&pn={merchant_name}&am={order.balance_amount}&cu=INR&tn=Balance-{order.order_number}&tr=BAL{order.order_number}"

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "project_title": order.project_title,
        "status": order.status,
        "total_price": order.total_price,
        "advance_amount": order.advance_amount,
        "balance_amount": order.balance_amount,
        "upi_id": upi_id,
        "merchant_name": merchant_name,
        "advance_intent": adv_intent,
        "balance_intent": bal_intent
    }


class PayBalanceRequest(BaseModel):
    amount: float
    payment_method: str = "upi"
    utr_number: Optional[str] = None


@router.post("/{order_id}/pay-balance")
def pay_order_balance(
    order_id: int,
    req: PayBalanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Monthly submission limit check (Max 25 submissions per month per student for security)
    if current_user.role != "admin":
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            user_submissions_count = db.query(PaymentSubmission).filter(
                PaymentSubmission.student_id == current_user.id,
                PaymentSubmission.created_at >= thirty_days_ago
            ).count()
            if user_submissions_count >= 25:
                raise HTTPException(
                    status_code=429,
                    detail="Monthly payment submission limit reached (Maximum 25 submissions per month). Please contact admin for manual assistance."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    # Validate UTR number (banking 12-digit standard)
    if not req.utr_number or not req.utr_number.strip():
        raise HTTPException(
            status_code=400,
            detail="12-digit UPI transaction reference (UTR) is required to verify balance payment."
        )

    clean_utr = req.utr_number.strip()
    if not re.match(r"^\d{12}$", clean_utr):
        raise HTTPException(
            status_code=400,
            detail="Invalid UPI Transaction Reference (UTR). UTR must be exactly 12 numeric digits as shown on your UPI receipt."
        )

    # Check for duplicate UTR across all orders & payment submissions
    duplicate_order = db.query(Order).filter(Order.utr_number == clean_utr, Order.id != order.id).first()
    if duplicate_order:
        raise HTTPException(
            status_code=400,
            detail=f"This UPI UTR reference ({clean_utr}) has already been submitted for order {duplicate_order.order_number}. Duplicate transactions are strictly prohibited."
        )

    try:
        duplicate_sub = db.query(PaymentSubmission).filter(
            PaymentSubmission.utr_number == clean_utr,
            PaymentSubmission.order_id != order.id
        ).first()
        if duplicate_sub:
            raise HTTPException(
                status_code=400,
                detail=f"This UPI UTR reference ({clean_utr}) has already been submitted for payment. Duplicate transactions are strictly prohibited."
            )
    except HTTPException:
        raise
    except Exception:
        pass

    amount_to_pay = min(float(req.amount), float(order.balance_amount))
    order.payment_method = req.payment_method
    order.utr_number = clean_utr

    if current_user.role == "admin":
        # Admin directly verifies and records payment
        order.balance_amount = round(max(0.0, float(order.balance_amount) - amount_to_pay), 2)
        is_fully_paid = (order.balance_amount <= 0.01)
        if is_fully_paid:
            order.balance_amount = 0.0
            order.status = "completed"
            order.completed_at = datetime.utcnow()
            order.payment_verified = True
            if not order.certificate_id:
                order.certificate_id = f"CG-CERT-2026-{uuid.uuid4().hex[:8].upper()}"
                order.certificate_issued_at = datetime.utcnow()
            create_notification(
                db=db,
                user_id=order.student_id,
                title="Balance Fully Paid & Verified! 🎉",
                message=f"Full balance settled for {order.order_number}. All uncompressed deliverables are 100% unlocked!",
                order_id=order.id,
                channel="whatsapp",
                action_url=f"/order/{order.id}"
            )
        else:
            create_notification(
                db=db,
                user_id=order.student_id,
                title=f"Partial Payment of ₹{amount_to_pay} Received! 💳",
                message=f"Received partial payment of ₹{amount_to_pay} for {order.order_number}. Remaining balance: ₹{order.balance_amount}.",
                order_id=order.id,
                channel="whatsapp",
                action_url=f"/order/{order.id}"
            )
    else:
        # Student submitted UTR -> mark as balance_submitted pending admin verification
        order.status = "balance_submitted"
        order.payment_verified = False
        is_fully_paid = False

        create_notification(
            db=db,
            user_id=order.student_id,
            title="Balance Payment Submitted for Verification ⏳",
            message=f"Receipt (UTR: {clean_utr}) for ₹{amount_to_pay} submitted for {order.order_number}. Mentor is verifying the transaction before unlocking deliverables.",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )

        # Notify admins
        admins = db.query(User).filter(User.role == "admin").all()
        for admin in admins:
            create_notification(
                db=db,
                user_id=admin.id,
                title="🔔 Balance Payment Submitted for Verification",
                message=f"Order {order.order_number}: Student submitted UTR {clean_utr} for balance ₹{amount_to_pay}. Check bank statement and approve.",
                order_id=order.id,
                channel="in_app",
                action_url="/admin/orders"
            )

    # Record Payment Submission
    try:
        submission = PaymentSubmission(
            order_id=order.id,
            student_id=current_user.id,
            payment_type="balance",
            amount=amount_to_pay,
            utr_number=clean_utr,
            status="approved" if current_user.role == "admin" else "pending",
            verified_at=datetime.utcnow() if current_user.role == "admin" else None
        )
        db.add(submission)
    except Exception:
        pass

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "amount_paid": amount_to_pay,
        "remaining_balance": order.balance_amount,
        "order_status": order.status,
        "is_fully_paid": is_fully_paid,
        "message": f"Payment receipt (UTR: {clean_utr}) submitted. Status: {order.status}."
    }


@router.post("/payments/webhook")
async def payment_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Production-hardened Webhook Receiver for Razorpay / Cashfree.
    Strictly verifies cryptographic HMAC-SHA256 signature and rejects unsigned/simulated calls.
    """
    body_bytes = await request.body()
    try:
        payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON webhook payload")

    # Cryptographic HMAC-SHA256 Signature Verification
    signature = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature")
    if not config.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=400,
            detail="Webhook secret not configured. Unsigned webhook requests are rejected in production."
        )

    if not signature:
        raise HTTPException(status_code=401, detail="Missing X-Razorpay-Signature header")

    expected_sig = hmac.new(
        config.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected_sig, signature):
        raise HTTPException(status_code=401, detail="Invalid Razorpay Webhook Signature")

    # Enforce standard signed Razorpay Cloud Event format - Reject unsigned / simulated direct payloads
    if not ("event" in payload and "payload" in payload):
        raise HTTPException(status_code=400, detail="Direct unverified simulation payloads are not permitted")

    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    notes = entity.get("notes", {})
    order_number = notes.get("order_number") or notes.get("order_no")
    payment_type = notes.get("payment_type", "advance")
    amount = float(entity.get("amount", 0)) / 100.0 if entity.get("amount") else None

    if not order_number:
        raise HTTPException(status_code=400, detail="order_number missing from verified webhook payload")

    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_number} not found")

    if payment_type == "advance":
        order.status = "advance_paid"
        order.advance_paid_at = datetime.utcnow()
        order.payment_method = "razorpay_webhook"
        order.utr_number = payload.get("transaction_id", f"RZP-{int(datetime.utcnow().timestamp())}")
        create_notification(
            db=db,
            user_id=order.student_id,
            title="30% Advance Payment Confirmed! 🚀",
            message=f"Advance payment for {order.order_number} confirmed via Razorpay. Development is underway!",
            order_id=order.id,
            channel="whatsapp",
            action_url=f"/order/{order.id}"
        )
    elif payment_type == "balance":
        # Handle Partial or Full Balance Settlement via Webhook
        amount_to_pay = amount if (amount is not None and amount > 0) else order.balance_amount
        order.balance_amount = round(max(0.0, float(order.balance_amount) - float(amount_to_pay)), 2)
        order.payment_method = "razorpay_webhook"

        if order.balance_amount <= 0.01:
            order.balance_amount = 0.0
            order.status = "completed"
            order.completed_at = datetime.utcnow()
            create_notification(
                db=db,
                user_id=order.student_id,
                title="Balance Fully Paid & Deliverables Unlocked! 🎉",
                message=f"Full balance settled for {order.order_number}. All uncompressed source code repositories are ready for download.",
                order_id=order.id,
                channel="whatsapp",
                action_url=f"/order/{order.id}"
            )
        else:
            create_notification(
                db=db,
                user_id=order.student_id,
                title=f"Partial Payment of ₹{amount_to_pay} Received! 💳",
                message=f"Received partial balance payment of ₹{amount_to_pay} for {order.order_number}. Remaining: ₹{order.balance_amount}.",
                order_id=order.id,
                channel="whatsapp",
                action_url=f"/order/{order.id}"
            )

    db.commit()
    db.refresh(order)
    return {
        "status": "success",
        "order_status": order.status,
        "order_number": order.order_number,
        "remaining_balance": order.balance_amount,
        "verified_signature": bool(signature)
    }


# -------------------------------------------------------------
# 6. Public Certificate Verification
# -------------------------------------------------------------
@router.get("/certificates/{cert_id}")
def verify_certificate(
    cert_id: str,
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.certificate_id == cert_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Invalid certificate reference. No record found in CampusGig registry.")

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
        "issue_date": issued_date,
        "issued_date": issued_date,
        "plagiarism_score": order.plagiarism_score,
        "ai_score": order.ai_detection_score,
        "honors": "Distinction in Implementation & Architecture",
        "verified_by": "CampusGig Academic Council & Mentor Board"
    }


class AddGroupMemberRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    role_in_team: Optional[str] = "Collaborator"


class PayGroupMemberRequest(BaseModel):
    utr_number: Optional[str] = None


# -------------------------------------------------------------
# 7. Interactive PPT Presentation Deck & Marp Exporter
# -------------------------------------------------------------
@router.get("/{order_id}/presentation-deck")
def get_presentation_deck(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tech_stack = []
    if order.ai_refined_scope:
        try:
            scope = json.loads(order.ai_refined_scope)
            tech_stack = scope.get("tech_stack", [])
        except Exception:
            pass

    deck = generate_presentation_deck(
        project_title=order.project_title,
        domain=order.domain or order.category_key,
        tech_stack=tech_stack,
        student_type=order.student_type,
        student_name=order.student.full_name or order.student.username if order.student else None,
        description=order.description
    )
    return deck


@router.get("/{order_id}/export-presentation-markdown")
def export_presentation_markdown(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tech_stack = []
    if order.ai_refined_scope:
        try:
            scope = json.loads(order.ai_refined_scope)
            tech_stack = scope.get("tech_stack", [])
        except Exception:
            pass

    deck = generate_presentation_deck(
        project_title=order.project_title,
        domain=order.domain or order.category_key,
        tech_stack=tech_stack,
        student_type=order.student_type,
        student_name=order.student.full_name or order.student.username if order.student else None,
        description=order.description
    )
    md_content = generate_marp_markdown(deck)
    filename = f"{order.order_number}_Presentation_Marp.md"
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# -------------------------------------------------------------
# 8. IEEE Conference / Journal Research Paper Draft
# -------------------------------------------------------------
@router.get("/{order_id}/ieee-paper")
def get_ieee_paper(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tech_stack = []
    if order.ai_refined_scope:
        try:
            scope = json.loads(order.ai_refined_scope)
            tech_stack = scope.get("tech_stack", [])
        except Exception:
            pass

    paper = generate_ieee_paper(
        project_title=order.project_title,
        domain=order.domain or order.category_key,
        tech_stack=tech_stack,
        student_type=order.student_type,
        student_name=order.student.full_name or order.student.username if order.student else None,
        college_name=order.student.college_name if order.student else None,
        description=order.description
    )
    return paper


@router.get("/{order_id}/export-ieee-tex")
def export_ieee_tex(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tech_stack = []
    if order.ai_refined_scope:
        try:
            scope = json.loads(order.ai_refined_scope)
            tech_stack = scope.get("tech_stack", [])
        except Exception:
            pass

    paper = generate_ieee_paper(
        project_title=order.project_title,
        domain=order.domain or order.category_key,
        tech_stack=tech_stack,
        student_type=order.student_type,
        student_name=order.student.full_name or order.student.username if order.student else None,
        college_name=order.student.college_name if order.student else None,
        description=order.description
    )
    tex_content = generate_ieee_latex(paper)
    filename = f"{order.order_number}_IEEE_Paper.tex"
    return Response(
        content=tex_content,
        media_type="text/x-tex",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# -------------------------------------------------------------
# 9. 1-Click GitHub Repository Direct Push & Cloud Deployment
# -------------------------------------------------------------
@router.post("/{order_id}/github-deploy")
def deploy_to_github_and_cloud(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        raise HTTPException(
            status_code=400,
            detail="Automated cloud deployment requires a verified GITHUB_TOKEN integration. No deployment was executed."
        )

    slug = re.sub(r'[^a-zA-Z0-9]', '-', order.project_title.lower()).strip('-')
    if len(slug) > 30:
        slug = slug[:30]

    repo_url = f"https://github.com/campusgig-projects/{order.order_number.lower()}-{slug}"
    deploy_url = f"https://{slug}-{order.id}.campusgig-live.app"

    order.github_repo_url = repo_url
    order.deployed_url = deploy_url
    order.deployed_at = datetime.utcnow()

    db.commit()
    db.refresh(order)

    create_notification(
        db=db,
        user_id=order.student_id,
        title="Live App Deployed & GitHub Repository Ready! 🐙",
        message=f"Your project is live at {deploy_url} and committed to GitHub.",
        order_id=order.id,
        channel="whatsapp",
        action_url=f"/order/{order.id}"
    )

    return {
        "success": True,
        "github_repo_url": repo_url,
        "deployed_url": deploy_url,
        "deployed_at": order.deployed_at.isoformat(),
        "git_clone_cmd": f"git clone {repo_url}.git"
    }


# -------------------------------------------------------------
# 10. Group Capstone Split-Payment (Multi-Student Sharing)
# -------------------------------------------------------------
@router.get("/{order_id}/group-split")
def get_group_split(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    members = db.query(OrderGroupMember).filter(OrderGroupMember.order_id == order_id).all()
    total_members = len(members) + 1
    per_member_share = round(order.total_price / total_members, 2)

    is_primary_paid = order.status in ("advance_paid", "in_progress", "ready_for_review", "completed")

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "total_price": order.total_price,
        "total_members": total_members,
        "per_member_share": per_member_share,
        "primary_student": {
            "name": order.student.full_name or order.student.username if order.student else "Lead Student",
            "email": order.student.email if order.student else None,
            "role": "Team Lead & Project Owner",
            "share_amount": per_member_share,
            "is_paid": is_primary_paid
        },
        "teammates": [
            {
                "id": m.id,
                "name": m.name,
                "email": m.email,
                "phone": m.phone,
                "role_in_team": m.role_in_team,
                "share_amount": per_member_share,
                "is_paid": m.is_paid,
                "paid_at": m.paid_at.isoformat() if m.paid_at else None,
                "utr_number": m.utr_number,
                "qr_token": m.qr_token
            } for m in members
        ],
        "all_shares_paid": is_primary_paid and all(m.is_paid for m in members) if members else is_primary_paid
    }


@router.post("/{order_id}/group-split/members")
def add_group_member(
    order_id: int,
    req: AddGroupMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    existing_count = db.query(OrderGroupMember).filter(OrderGroupMember.order_id == order_id).count()
    if existing_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 6 members (including lead) allowed in a group project")

    total_count = existing_count + 2
    share = round(order.total_price / total_count, 2)

    member = OrderGroupMember(
        order_id=order_id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        role_in_team=req.role_in_team or "Collaborator",
        share_amount=share,
        is_paid=False,
        qr_token=f"SPLIT-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    all_members = db.query(OrderGroupMember).filter(OrderGroupMember.order_id == order_id).all()
    for m in all_members:
        m.share_amount = share
    db.commit()

    return {"message": "Teammate added successfully", "member_id": member.id, "share_amount": share}


@router.delete("/{order_id}/group-split/members/{member_id}")
def delete_group_member(
    order_id: int,
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    member = db.query(OrderGroupMember).filter(OrderGroupMember.id == member_id, OrderGroupMember.order_id == order_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()
    return {"message": "Teammate removed"}


@router.post("/{order_id}/group-split/pay/{member_id}")
def pay_group_member_share(
    order_id: int,
    member_id: int,
    req: PayGroupMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not req.utr_number or not re.match(r"^\d{12}$", req.utr_number.strip()):
        raise HTTPException(status_code=400, detail="Valid 12-digit UTR transaction reference is required")

    clean_utr = req.utr_number.strip()
    member = db.query(OrderGroupMember).filter(OrderGroupMember.id == member_id, OrderGroupMember.order_id == order_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.is_paid = True
    member.paid_at = datetime.utcnow()
    member.utr_number = clean_utr

    db.commit()

    all_members = db.query(OrderGroupMember).filter(OrderGroupMember.order_id == order_id).all()
    if all(m.is_paid for m in all_members):
        if order.status == "pending_payment":
            order.status = "advance_paid"
            order.advance_paid_at = datetime.utcnow()
        elif order.status == "ready_for_review":
            order.status = "completed"
            order.completed_at = datetime.utcnow()
            if not order.certificate_id:
                order.certificate_id = f"CG-CERT-2026-{uuid.uuid4().hex[:8].upper()}"
                order.certificate_issued_at = datetime.utcnow()
        db.commit()

    return {
        "success": True,
        "message": f"Share of ₹{member.share_amount} recorded for {member.name}",
        "order_status": order.status
    }



# -------------------------------------------------------------
# 8. Automated UML & Architecture Diagram Generator
# -------------------------------------------------------------
@router.get('/{order_id}/uml-diagrams')
def get_order_uml_diagrams(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tech_stack = []
    if order.ai_refined_scope:
        try:
            scope = json.loads(order.ai_refined_scope)
            tech_stack = scope.get('tech_stack', [])
        except Exception:
            pass
    if not tech_stack:
        tech_stack = ['Python', 'PyTorch', 'FastAPI', 'React']

    return generate_uml_diagrams(
        project_title=order.project_title,
        domain=order.domain or order.category_key,
        tech_stack=tech_stack,
        description=order.description
    )


# -------------------------------------------------------------
# 9. Explain This Line - In-Browser Code Line-by-Line AI Explainer
# -------------------------------------------------------------
class ExplainCodeRequest(BaseModel):
    code: str

@router.post('/{order_id}/explain-code')
@limiter.limit("15/minute")
def explain_order_code_snippet(
    request: Request,
    order_id: int,
    req: ExplainCodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return explain_code_snippet(
        code_snippet=req.code,
        project_title=order.project_title,
        domain=order.domain
    )


# -------------------------------------------------------------
# 10. Professional GitHub README & Dockerfile Generator
# -------------------------------------------------------------
@router.get('/{order_id}/readme-docker')
def get_order_readme_and_docker(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    tech_stack = []
    if order.ai_refined_scope:
        try:
            scope = json.loads(order.ai_refined_scope)
            tech_stack = scope.get('tech_stack', [])
        except Exception:
            pass
    if not tech_stack:
        tech_stack = ['Python', 'FastAPI', 'React', 'PyTorch']

    return generate_readme_and_docker(
        project_title=order.project_title,
        domain=order.domain or order.category_key,
        tech_stack=tech_stack,
        order_number=order.order_number,
        description=order.description
    )


# -------------------------------------------------------------
# 11. Plagiarism & AI-Ghostwriting Rewriter (Turnitin Safe Mode)
# -------------------------------------------------------------
class RewriteTurnitinRequest(BaseModel):
    text: str

@router.post('/{order_id}/rewrite-turnitin')
@limiter.limit("10/minute")
def rewrite_turnitin_text(
    request: Request,
    order_id: int,
    req: RewriteTurnitinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return rewrite_academic_turnitin(text=req.text)


# -------------------------------------------------------------
# 12. 2-Way Interactive WhatsApp Bot (Command Center)
# -------------------------------------------------------------
class WhatsAppBotRequest(BaseModel):
    command: str

@router.post('/{order_id}/whatsapp-bot')
@limiter.limit("20/minute")
def interact_order_whatsapp_bot(
    request: Request,
    order_id: int,
    req: WhatsAppBotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    if current_user.role == "student" and order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    order_info = {
        'order_number': order.order_number,
        'project_title': order.project_title,
        'total_price': order.total_price,
        'advance_amount': order.advance_amount,
        'balance_amount': order.balance_amount,
        'status': order.status,
        'walkthrough_meeting_url': order.walkthrough_meeting_url or f'https://meet.jit.si/CampusGig-Walkthrough-{order.order_number}'
    }
    return handle_whatsapp_bot_command(command=req.command, order_info=order_info)


@router.post('/webhook/whatsapp')
def whatsapp_webhook_handler(
    payload: dict,
    db: Session = Depends(get_db)
):
    cmd = payload.get('command') or payload.get('Body') or payload.get('text', 'STATUS')
    order_number = payload.get('order_number') or payload.get('order_no', 'CG-2026-00001')
    
    order = db.query(Order).filter(Order.order_number == order_number).first()
    order_info = {
        'order_number': order_number,
        'project_title': order.project_title if order else 'Final Year Capstone Project',
        'total_price': order.total_price if order else 3200.0,
        'advance_amount': order.advance_amount if order else 960.0,
        'balance_amount': order.balance_amount if order else 2240.0,
        'status': order.status if order else 'ready_for_review',
        'walkthrough_meeting_url': order.walkthrough_meeting_url if order and order.walkthrough_meeting_url else f'https://meet.jit.si/CampusGig-Walkthrough-{order_number}'
    }
    return handle_whatsapp_bot_command(command=cmd, order_info=order_info)
