from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, func
from app.database import Base


class PricingConfig(Base):
    __tablename__ = "pricing_configs"

    id = Column(Integer, primary_key=True, index=True)
    category_key = Column(String, unique=True, index=True, nullable=False)
    category_name = Column(String, nullable=False)
    student_type = Column(String, nullable=False)  # "school" / "college"
    base_price = Column(Float, nullable=False)
    unit_description = Column(String, nullable=True, default="Per Project")
    add_ons_json = Column(Text, nullable=True)   # JSON string: {"ppt": 350, "report": 500, ...}
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
