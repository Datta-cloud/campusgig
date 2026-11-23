from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class PaymentSubmission(Base):
    __tablename__ = "payment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    payment_type = Column(String, nullable=False)  # "advance" or "balance"
    amount = Column(Float, nullable=False)
    utr_number = Column(String, nullable=False, index=True)
    status = Column(String, default="pending", index=True)  # "pending", "approved", "rejected"
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    verified_at = Column(DateTime, nullable=True)

    order = relationship("Order", backref="payment_submissions")
    student = relationship("User")
