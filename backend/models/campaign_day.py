from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from backend.database.base import Base


class CampaignDay(Base):
    __tablename__ = "campaign_days"
    id = Column(Integer, primary_key=True)
    focus_date = Column(Date, nullable=False, unique=True, index=True)
    industry = Column(String(200), nullable=False)
    campaign_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
