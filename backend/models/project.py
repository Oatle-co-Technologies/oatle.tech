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


class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    client_id = Column(
        Integer,
        ForeignKey("clients.id"),
        nullable=False,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    website = Column(
        String,
        nullable=True,
    )

    # Kept temporarily so existing projects continue working.
    # We will migrate away from this field later.
    plan = Column(
        String,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="planning",
    )

    target_date = Column(
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

    client = relationship(
        "Client",
    )

    product = relationship(
        "Product",
    )

    project_addons = relationship(
        "ProjectAddOn",
        back_populates="project",
        cascade="all, delete-orphan",
    )