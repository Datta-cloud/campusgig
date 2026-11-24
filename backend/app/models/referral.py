from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ReferralRecord(Base):
    __tablename__ = "referral_records"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    referred_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    referral_code = Column(String, nullable=False, index=True)
    status = Column(String, default="pending")  # "pending", "completed", "rejected"
    reward_amount = Column(Float, default=250.0)
    qualifying_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    credited_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    referrer = relationship("User", foreign_keys=[referrer_id])
    referred = relationship("User", foreign_keys=[referred_id])
    qualifying_order = relationship("Order", foreign_keys=[qualifying_order_id])


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)  # "credit", "debit"
    description = Column(String, nullable=False)
    reference_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")


class ReferralProgramConfig(Base):
    __tablename__ = "referral_program_configs"

    id = Column(Integer, primary_key=True, index=True)
    is_enabled = Column(Boolean, default=True)
    referrer_reward = Column(Float, default=250.0)
    referred_discount = Column(Float, default=200.0)
    min_qualifying_amount = Column(Float, default=500.0)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
