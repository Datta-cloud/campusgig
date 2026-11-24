import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.order import Order
from app.models.referral import ReferralRecord, WalletTransaction, ReferralProgramConfig
from app.services.notification_service import create_notification


def process_qualifying_referral(db: Session, order: Order):
    """
    Checks if this is the student's first qualifying order, and credits the referrer's wallet.
    Prevents self-referral, duplicate rewards, and respects admin referral settings.
    """
    try:
        student = db.query(User).filter(User.id == order.student_id).first()
        if not student or not student.referred_by:
            return

        # Check referral settings
        config = db.query(ReferralProgramConfig).first()
        if config and not config.is_enabled:
            return

        min_amount = config.min_qualifying_amount if config else 500.0
        reward_amt = config.referrer_reward if config else 250.0

        if (order.total_price or 0.0) < min_amount:
            return

        # Find referrer
        referrer = db.query(User).filter(User.referral_code == student.referred_by).first()
        if not referrer or referrer.id == student.id:
            return  # Fraud check: cannot refer oneself

        # Find or create ReferralRecord
        ref_record = db.query(ReferralRecord).filter(ReferralRecord.referred_id == student.id).first()
        if not ref_record:
            ref_record = ReferralRecord(
                referrer_id=referrer.id,
                referred_id=student.id,
                referral_code=student.referred_by,
                status="pending",
                reward_amount=reward_amt
            )
            db.add(ref_record)
            db.flush()

        # If already completed or rejected, do not duplicate
        if ref_record.status == "completed":
            return

        # Credit reward
        ref_record.status = "completed"
        ref_record.qualifying_order_id = order.id
        ref_record.credited_at = datetime.utcnow()
        ref_record.reward_amount = reward_amt

        referrer.wallet_balance = (referrer.wallet_balance or 0.0) + reward_amt

        # Log wallet transaction
        tx = WalletTransaction(
            user_id=referrer.id,
            amount=reward_amt,
            transaction_type="credit",
            description=f"Referral reward for inviting {student.full_name or student.username} (Order #{order.order_number})",
            reference_id=order.order_number
        )
        db.add(tx)

        # Notify referrer
        create_notification(
            db=db,
            user_id=referrer.id,
            title="🎉 Referral Reward Credited!",
            message=f"₹{int(reward_amt)} cashback has been added to your Ambassador Wallet! {student.full_name or 'Your friend'} booked their first verified project ({order.order_number}).",
            order_id=order.id,
            channel="whatsapp",
            action_url="/dashboard"
        )
    except Exception as e:
        print(f"Referral processing error: {e}")
