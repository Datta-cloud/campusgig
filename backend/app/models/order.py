from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_type = Column(String, nullable=False)  # "school" / "college"
    category_key = Column(String, nullable=False)
    project_title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    ai_refined_scope = Column(Text, nullable=True)  # JSON/text from AI
    domain = Column(String, nullable=True)  # "Machine Learning", "GenAI", etc.
    deliverables_json = Column(Text, nullable=True)  # JSON list: ["code","ppt","report",...]
    page_count = Column(Integer, nullable=True)  # for school assignments
    deadline = Column(DateTime, nullable=True)
    urgency = Column(String, default="normal")  # "normal"/"express"/"super_express"
    base_price = Column(Float, default=0.0)
    addons_price = Column(Float, default=0.0)
    urgency_fee = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    advance_amount = Column(Float, default=0.0)   # 30%
    balance_amount = Column(Float, default=0.0)   # 70%
    status = Column(String, default="pending_payment")
    # "pending_payment"/"advance_paid"/"in_progress"/"ready_for_review"/"completed"/"cancelled"
    advance_paid_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    payment_method = Column(String, nullable=True)  # "upi"/"razorpay"/"cash"
    utr_number = Column(String, nullable=True)
    admin_notes = Column(Text, nullable=True)
    student_notes = Column(Text, nullable=True)

    # Revisions workflow
    revision_count = Column(Integer, default=0)
    max_revisions = Column(Integer, default=2)
    revision_notes = Column(Text, nullable=True)
    revision_requested_at = Column(DateTime, nullable=True)

    # Academic Plagiarism & AI Check
    plagiarism_score = Column(Float, nullable=True)      # e.g., 4.5%
    ai_detection_score = Column(Float, nullable=True)    # e.g., 0.0%
    plagiarism_report_url = Column(String, nullable=True)

    # 1-on-1 Walkthrough Scheduler
    walkthrough_scheduled_at = Column(DateTime, nullable=True)
    walkthrough_meeting_url = Column(String, nullable=True)

    # Verifiable Certificate of Implementation
    certificate_id = Column(String, unique=True, nullable=True, index=True)
    certificate_issued_at = Column(DateTime, nullable=True)

    # 1-Click GitHub & Deployment
    github_repo_url = Column(String, nullable=True)
    deployed_url = Column(String, nullable=True)
    deployed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User", back_populates="orders", foreign_keys=[student_id])
    messages = relationship("ChatMessage", back_populates="order")
    attachments = relationship("OrderAttachment", back_populates="order")
    group_members = relationship("OrderGroupMember", back_populates="order", cascade="all, delete-orphan")


class OrderGroupMember(Base):
    __tablename__ = "order_group_members"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role_in_team = Column(String, default="Collaborator")
    share_amount = Column(Float, default=0.0)
    is_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)
    utr_number = Column(String, nullable=True)
    qr_token = Column(String, nullable=True)

    order = relationship("Order", back_populates="group_members")
