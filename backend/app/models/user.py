from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="student")  # "admin" / "student"
    student_type = Column(String, nullable=True)  # "school" / "college"
    school_class = Column(String, nullable=True)   # e.g. "10th", "12th"
    college_name = Column(String, nullable=True)
    college_branch = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    referral_code = Column(String, unique=True, nullable=True, index=True)
    referred_by = Column(String, nullable=True)
    wallet_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    orders = relationship("Order", back_populates="student", foreign_keys="Order.student_id")
    messages = relationship("ChatMessage", back_populates="sender", foreign_keys="ChatMessage.sender_id")
    enrollments = relationship("CourseEnrollment", back_populates="student")
