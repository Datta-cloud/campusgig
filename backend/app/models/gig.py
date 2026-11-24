from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, func
from app.database import Base


class Gig(Base):
    __tablename__ = "gigs"

    id = Column(String, primary_key=True, index=True)
    category_key = Column(String, index=True, nullable=False)
    category_name = Column(String, nullable=False)
    domain = Column(String, nullable=False)  # "College Engineering", "School (Class 1-10th)", "Technical Mentoring"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    thumbnail = Column(String, nullable=False)
    starting_price = Column(Float, nullable=False, default=500.0)
    delivery_days = Column(Integer, default=3)
    delivery_time = Column(String, default="3–5 Days")
    rating = Column(Float, default=4.9)
    reviews_count = Column(Integer, default=10)
    orders_count = Column(Integer, default=15)
    views_count = Column(Integer, default=50)
    mentor_name = Column(String, nullable=False)
    mentor_avatar = Column(String, nullable=False)
    mentor_role = Column(String, nullable=False)
    mentor_verified = Column(Boolean, default=True)
    tags_json = Column(Text, default="[]")  # JSON list of tags/skills
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
