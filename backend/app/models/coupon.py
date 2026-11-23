from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func
from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_percent = Column(Float, nullable=False, default=10.0)  # e.g. 10.0 for 10%
    max_uses = Column(Integer, nullable=False, default=100)        # Total coupons released (0 = unlimited)
    used_count = Column(Integer, nullable=False, default=0)        # Times redeemed so far
    is_active = Column(Boolean, default=True)                      # Active/inactive toggle
    description = Column(String, nullable=True)                    # e.g. "Datta Official Student Promo"
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
