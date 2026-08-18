from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.base import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(255), index=True)
    company: Mapped[str | None] = mapped_column(String(150), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    stage: Mapped[str] = mapped_column(
        String(50),
        default="new",
    )

    response: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    follow_up_reason: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    contact_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    last_contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    next_follow_up_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    marketing_email_opt_in: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    marketing_sms_opt_in: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )