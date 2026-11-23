from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class WalkthroughSession(Base):
    __tablename__ = "walkthrough_sessions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_number = Column(Integer, default=1)
    topic = Column(String, nullable=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=30)
    meeting_url = Column(String, nullable=False)
    status = Column(String, default="scheduled", index=True)  # "scheduled", "completed", "cancelled", "rescheduled"
    mentor_notes = Column(Text, nullable=True)
    recording_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    order = relationship("Order", backref="walkthrough_sessions_list")
    student = relationship("User", foreign_keys=[student_id])
