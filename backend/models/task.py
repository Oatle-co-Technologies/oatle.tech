from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.database.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False,
    )

    name = Column(String, nullable=False)

    description = Column(Text, nullable=True)

    category = Column(String, nullable=True)

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

    due_date = Column(Date, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    project = relationship("Project")