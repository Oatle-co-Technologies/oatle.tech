from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from backend.database.base import Base


class Staff(Base):
    __tablename__ = "staff"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    auth_user_id = Column(
        UUID(as_uuid=True),
        nullable=True,
        unique=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        nullable=False,
        unique=True,
    )

    job_title = Column(
        String,
        nullable=True,
    )

    access_level = Column(
        String,
        nullable=False,
        default="member",
    )

    employment_type = Column(
        String,
        nullable=False,
        default="employee",
    )

    is_temporary = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )