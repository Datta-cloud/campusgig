import random
import string
import os
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.referral import ReferralRecord, WalletTransaction, ReferralProgramConfig
from app.services.auth_service import get_current_user, require_admin
from app.services.notification_service import create_notification

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])


class ApplyDiscountRequest(BaseModel):
    order_id: int
    amount: float


class ReferralSettingsUpdateRequest(BaseModel):
    is_enabled: Optional[bool] = None
    referrer_reward: Optional[float] = None
    referred_discount: Optional[float] = None
    min_qualifying_amount: Optional[float] = None


class ReferralDisputeActionRequest(BaseModel):
    action: str  # "approve" or "reject"
    reason: Optional[str] = None


def get_or_create_config(db: Session) -> ReferralProgramConfig:
    cfg = db.query(ReferralProgramConfig).first()
    if not cfg:
        cfg = ReferralProgramConfig(
            is_enabled=True,
            referrer_reward=250.0,
            referred_discount=200.0,
            min_qualifying_amount=500.0
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@router.get("/my-wallet")
def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user has a unique referral code
    if not current_user.referral_code:
        prefix = "".join(c for c in (current_user.username or "STUDENT") if c.isalnum()).upper()[:4] or "CAMP"
        rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        ref_code = f"{prefix}{rand_suffix}"
        while db.query(User).filter(User.referral_code == ref_code).first():
            rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
            ref_code = f"{prefix}{rand_suffix}"
        current_user.referral_code = ref_code
        db.commit()
        db.refresh(current_user)

    cfg = get_or_create_config(db)

    # Query referral records
    records = db.query(ReferralRecord).filter(ReferralRecord.referrer_id == current_user.id).order_by(ReferralRecord.created_at.desc()).all()
    total_referred = len(records)
    successful_referrals = sum(1 for r in records if r.status == "completed")
    pending_referrals = sum(1 for r in records if r.status == "pending")
    total_rewards_earned = sum(r.reward_amount for r in records if r.status == "completed")

    # If no records exist yet but user had referred_by users in legacy DB
    if total_referred == 0 and current_user.referral_code:
        legacy_users = db.query(User).filter(User.referred_by == current_user.referral_code).all()
        for u in legacy_users:
            rec = ReferralRecord(
                referrer_id=current_user.id,
                referred_id=u.id,
                referral_code=current_user.referral_code,
                status="completed" if (u.orders and len(u.orders) > 0) else "pending",
                reward_amount=cfg.referrer_reward
            )
            db.add(rec)
        if legacy_users:
            db.commit()
            records = db.query(ReferralRecord).filter(ReferralRecord.referrer_id == current_user.id).order_by(ReferralRecord.created_at.desc()).all()
            total_referred = len(records)
            successful_referrals = sum(1 for r in records if r.status == "completed")
            pending_referrals = sum(1 for r in records if r.status == "pending")
            total_rewards_earned = sum(r.reward_amount for r in records if r.status == "completed")

    # Wallet transactions ledger
    transactions = db.query(WalletTransaction).filter(WalletTransaction.user_id == current_user.id).order_by(WalletTransaction.created_at.desc()).limit(20).all()

    # Determine Ambassador tier
    tier = "Bronze Ambassador 🥉"
    if successful_referrals >= 10:
        tier = "Diamond Ambassador 💎"
    elif successful_referrals >= 5:
        tier = "Gold Ambassador 🥇"
    elif successful_referrals >= 2:
        tier = "Silver Ambassador 🥈"

    frontend_url = os.getenv("FRONTEND_URL", "https://campusgig-ai.vercel.app").rstrip("/")

    return {
        "referral_code": current_user.referral_code,
        "referral_link": f"{frontend_url}/?ref={current_user.referral_code}",
        "wallet_balance": current_user.wallet_balance or 0.0,
        "total_referred": total_referred,
        "successful_referrals": successful_referrals,
        "pending_referrals": pending_referrals,
        "total_rewards_earned": total_rewards_earned,
        "ambassador_tier": tier,
        "program_enabled": cfg.is_enabled,
        "reward_per_referral": cfg.referrer_reward,
        "referred_discount": cfg.referred_discount,
        "benefits": [
            f"₹{int(cfg.referrer_reward)} cashback credited to your wallet after friend's first eligible order",
            f"Your friends receive flat ₹{int(cfg.referred_discount)} off their project with your link",
            "100% wallet balance can be applied to your own project advance or balance fees",
            "Official Campus Ambassador Certificate issued on 5+ successful referrals",
            "Priority mentor matching & free 1-on-1 career guidance"
        ],
        "referral_history": [
            {
                "id": r.id,
                "name": r.referred.full_name or r.referred.username if r.referred else "Student",
                "college": r.referred.college_name if r.referred else "Engineering College",
                "status": r.status,  # "pending", "completed", "rejected"
                "reward_amount": r.reward_amount,
                "qualifying_order": r.qualifying_order.order_number if r.qualifying_order else None,
                "credited_at": r.credited_at.strftime("%b %d, %Y") if r.credited_at else None,
                "date": r.created_at.strftime("%b %d, %Y") if r.created_at else "Recently"
            } for r in records
        ],
        "wallet_transactions": [
            {
                "id": tx.id,
                "amount": tx.amount,
                "transaction_type": tx.transaction_type,  # "credit", "debit"
                "description": tx.description,
                "reference_id": tx.reference_id,
                "date": tx.created_at.strftime("%b %d, %Y %I:%M %p") if tx.created_at else "Recently"
            } for tx in transactions
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

    if order.status not in ("pending_payment", "ready_for_review"):
        raise HTTPException(status_code=400, detail="Wallet discount can only be applied to orders pending advance or balance payment")

    wallet_bal = current_user.wallet_balance or 0.0
    if req.amount <= 0 or req.amount > wallet_bal:
        raise HTTPException(status_code=400, detail="Invalid discount amount or insufficient wallet balance")

    max_discount = min(wallet_bal, order.total_price * 0.30)
    discount_to_apply = min(req.amount, max_discount)

    current_user.wallet_balance = wallet_bal - discount_to_apply
    order.total_price = max(100.0, order.total_price - discount_to_apply)
    order.advance_amount = round(order.total_price * 0.30, 2)
    order.balance_amount = max(0.0, order.total_price - order.advance_amount)

    # Log debit transaction
    tx = WalletTransaction(
        user_id=current_user.id,
        amount=discount_to_apply,
        transaction_type="debit",
        description=f"Applied wallet discount on Order #{order.order_number}",
        reference_id=order.order_number
    )
    db.add(tx)

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "discount_applied": discount_to_apply,
        "new_total_price": order.total_price,
        "new_advance_amount": order.advance_amount,
        "remaining_wallet_balance": current_user.wallet_balance
    }


# ==========================================
# ADMIN CONTROLS FOR REFERRAL & REWARD
# ==========================================

@router.get("/admin/overview")
def get_admin_referral_overview(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    cfg = get_or_create_config(db)
    records = db.query(ReferralRecord).order_by(ReferralRecord.created_at.desc()).all()

    total_referrals = len(records)
    completed_rewards = sum(r.reward_amount for r in records if r.status == "completed")
    pending_count = sum(1 for r in records if r.status == "pending")

    formatted_records = []
    for r in records:
        # Fraud check flag: e.g. same email domain or same IP/phone
        is_suspicious = False
        suspicion_reason = None
        if r.referrer and r.referred:
            if r.referrer_id == r.referred_id:
                is_suspicious = True
                suspicion_reason = "Self referral attempt"
            elif r.referrer.phone and r.referred.phone and r.referrer.phone == r.referred.phone:
                is_suspicious = True
                suspicion_reason = "Matching phone number"

        formatted_records.append({
            "id": r.id,
            "referral_code": r.referral_code,
            "referrer_name": r.referrer.full_name or r.referrer.username if r.referrer else "Unknown",
            "referrer_email": r.referrer.email if r.referrer else "",
            "referred_name": r.referred.full_name or r.referred.username if r.referred else "Unknown",
            "referred_email": r.referred.email if r.referred else "",
            "status": r.status,
            "reward_amount": r.reward_amount,
            "qualifying_order": r.qualifying_order.order_number if r.qualifying_order else None,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else None,
            "credited_at": r.credited_at.strftime("%Y-%m-%d %H:%M") if r.credited_at else None,
            "is_suspicious": is_suspicious,
            "suspicion_reason": suspicion_reason
        })

    return {
        "config": {
            "is_enabled": cfg.is_enabled,
            "referrer_reward": cfg.referrer_reward,
            "referred_discount": cfg.referred_discount,
            "min_qualifying_amount": cfg.min_qualifying_amount
        },
        "stats": {
            "total_referrals": total_referrals,
            "total_rewards_distributed": completed_rewards,
            "pending_referrals": pending_count
        },
        "records": formatted_records
    }


@router.put("/admin/settings")
def update_referral_settings(
    req: ReferralSettingsUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    cfg = get_or_create_config(db)
    if req.is_enabled is not None:
        cfg.is_enabled = req.is_enabled
    if req.referrer_reward is not None:
        cfg.referrer_reward = req.referrer_reward
    if req.referred_discount is not None:
        cfg.referred_discount = req.referred_discount
    if req.min_qualifying_amount is not None:
        cfg.min_qualifying_amount = req.min_qualifying_amount

    db.commit()
    db.refresh(cfg)
    return {
        "success": True,
        "config": {
            "is_enabled": cfg.is_enabled,
            "referrer_reward": cfg.referrer_reward,
            "referred_discount": cfg.referred_discount,
            "min_qualifying_amount": cfg.min_qualifying_amount
        }
    }


@router.post("/admin/{record_id}/action")
def handle_referral_dispute_action(
    record_id: int,
    req: ReferralDisputeActionRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rec = db.query(ReferralRecord).filter(ReferralRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Referral record not found")

    if req.action == "approve":
        if rec.status != "completed":
            rec.status = "completed"
            rec.credited_at = datetime.utcnow()
            if rec.referrer:
                rec.referrer.wallet_balance = (rec.referrer.wallet_balance or 0.0) + rec.reward_amount
                tx = WalletTransaction(
                    user_id=rec.referrer.id,
                    amount=rec.reward_amount,
                    transaction_type="credit",
                    description=f"Admin manually approved referral reward for {rec.referred.full_name or rec.referred.username if rec.referred else 'referral'}",
                    reference_id=f"ADMIN-REF-{rec.id}"
                )
                db.add(tx)
    elif req.action == "reject":
        rec.status = "rejected"
        rec.rejection_reason = req.reason or "Rejected by administrator"

    db.commit()
    db.refresh(rec)
    return {"success": True, "status": rec.status}
