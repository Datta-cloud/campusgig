import sys
import os

# Set path to backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
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
from app.services.auth_service import hash_password

def run_reset():
    # Make sure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Purging all student data and coupons...")
        db.query(PaymentSubmission).delete()
        db.query(WalkthroughSession).delete()
        db.query(ChatMessage).delete()
        db.query(OrderAttachment).delete()
        db.query(OrderGroupMember).delete()
        db.query(Notification).delete()
        db.query(CourseEnrollment).delete()
        db.query(Order).delete()
        db.query(Coupon).delete()
        db.query(User).filter(User.username != "DattaHadke").delete()

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

        db.query(User).filter(User.role == "admin", User.username != "DattaHadke").delete()

        # Update ML base price to 1500
        ml_config = db.query(PricingConfig).filter(PricingConfig.category_key == "college_ml").first()
        if ml_config:
            ml_config.base_price = 1500.0

        db.commit()
        print("✓ Local database reset successfully.")
        print(f"Users remaining: {db.query(User).count()} (Admin: {admin_user.username})")
        print(f"Orders remaining: {db.query(Order).count()}")
        print(f"Coupons remaining: {db.query(Coupon).count()}")
        print(f"ML Base Price: {ml_config.base_price if ml_config else 'N/A'}")
    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_reset()
