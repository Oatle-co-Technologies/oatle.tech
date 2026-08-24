from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import relationship

from backend.database.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    invoice_number = Column(
        String,
        unique=True,
        nullable=True,
        index=True,
    )

    client_id = Column(
        Integer,
        ForeignKey("clients.id"),
        nullable=False,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True,
    )

    discount_percent = Column(
        Float,
        nullable=False,
        default=0,
    )

    amount = Column(
        Float,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="draft",
    )

    issue_date = Column(
        Date,
        nullable=False,
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    paid_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    client = relationship("Client")

    project = relationship("Project")