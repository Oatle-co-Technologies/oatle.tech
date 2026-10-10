from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.database.base import Base
from backend.models.campaign_day import CampaignDay  # Register campaign FK for standalone task queries.


class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    campaign_day_id = Column(Integer, ForeignKey("campaign_days.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    setup_key = Column(String(160), nullable=True, unique=True)

    project_id = Column(
        Integer,
        ForeignKey(
            "projects.id",
            ondelete="NO ACTION",
        ),
        nullable=True,
    )

    product_service_id = Column(
        Integer,
        ForeignKey(
            "product_services.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    service_id = Column(
        Integer,
        ForeignKey(
            "services.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    assigned_to = Column(
        Integer,
        ForeignKey(
            "staff.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    task_type = Column(
        String(20),
        nullable=False,
        default="product",
    )

    name = Column(
        String,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    category = Column(
        String,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="todo",
    )

    priority = Column(
        String,
        nullable=False,
        default="medium",
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    project = relationship(
        "Project",
    )

    product_service = relationship(
        "ProductService",
    )

    service = relationship(
        "Service",
    )

    assigned_staff = relationship(
        "Staff", foreign_keys=[assigned_to],
    )