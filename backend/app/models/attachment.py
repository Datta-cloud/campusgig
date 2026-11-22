from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class OrderAttachment(Base):
    __tablename__ = "order_attachments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, default="reference")  # "reference"/"deliverable"/"preview"
    uploaded_by = Column(String, default="student")  # "admin"/"student"
    created_at = Column(DateTime, default=func.now())

    # Relationships
    order = relationship("Order", back_populates="attachments")
