from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])


class ApplyDiscountRequest(BaseModel):
    order_id: int
    amount: float


@router.get("/my-wallet")
def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user has a referral code
    if not current_user.referral_code:
        prefix = (current_user.username or "STUDENT").upper().replace("_", "")[:6]
        current_user.referral_code = f"{prefix}2026"
        if not current_user.wallet_balance:
            current_user.wallet_balance = 300.0  # Welcome signup reward
        db.commit()
        db.refresh(current_user)

    # Count referred users
    referred_students = db.query(User).filter(User.referred_by == current_user.referral_code).all()
    total_referred = len(referred_students)

    tier = "Bronze Ambassador"
    if total_referred >= 10:
        tier = "Diamond Ambassador 💎"
    elif total_referred >= 5:
        tier = "Gold Ambassador 🥇"
    elif total_referred >= 2:
        tier = "Silver Ambassador 🥈"

    return {
        "referral_code": current_user.referral_code,
        "referral_link": f"http://127.0.0.1:5173/register?ref={current_user.referral_code}",
        "wallet_balance": current_user.wallet_balance or 0.0,
        "total_referred": total_referred,
        "ambassador_tier": tier,
        "reward_per_referral": 250.0,
        "benefits": [
            "₹250 cashback for every junior or friend who books a project",
            "Your friends get flat ₹200 off on their first order",
            "Official Campus Ambassador Certificate on 5+ successful referrals",
            "Direct 1-on-1 career mentorship from senior tech leads"
        ],
        "recent_referrals": [
            {
                "id": s.id,
                "name": s.full_name or s.username,
                "college": s.college_name or "Engineering College",
                "reward_earned": 250.0,
                "date": s.created_at.strftime("%b %d, %Y") if s.created_at else "Recently"
            } for s in referred_students[:5]
        ]
    }


@router.post("/apply-discount")
def apply_wallet_discount(
    req: ApplyDiscountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if order.status != "pending_payment":
        raise HTTPException(status_code=400, detail="Wallet discount can only be applied to orders pending advance payment")

    wallet_bal = current_user.wallet_balance or 0.0
    if req.amount <= 0 or req.amount > wallet_bal:
        raise HTTPException(status_code=400, detail="Invalid discount amount or insufficient wallet balance")

    max_discount = min(300.0, order.total_price * 0.20)
    discount_to_apply = min(req.amount, max_discount)

    current_user.wallet_balance = wallet_bal - discount_to_apply
    order.total_price = max(100.0, order.total_price - discount_to_apply)
    order.advance_amount = round(order.total_price * 0.30, 2)
    order.balance_amount = max(0.0, order.total_price - order.advance_amount)

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "discount_applied": discount_to_apply,
        "new_total_price": order.total_price,
        "new_advance_amount": order.advance_amount,
        "remaining_wallet_balance": current_user.wallet_balance
    }
