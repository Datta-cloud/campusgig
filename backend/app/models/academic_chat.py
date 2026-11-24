from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class AcademicChatMessage(Base):
    __tablename__ = "academic_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    session_id = Column(String(128), index=True, nullable=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    student_type = Column(String(50), default="college")
    created_at = Column(DateTime, default=func.now())

    # Relationship
    user = relationship("User", foreign_keys=[user_id])
