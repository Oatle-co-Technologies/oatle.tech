from datetime import datetime

from pydantic import BaseModel, EmailStr


class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    company: str | None = None
    phone: str | None = None

    source: str | None = None

    stage: str = "new"

    response: str | None = None

    follow_up_reason: str | None = None

    contact_attempts: int = 0

    last_contacted_at: datetime | None = None

    next_follow_up_at: datetime | None = None

    notes: str | None = None

    marketing_email_opt_in: bool = False

    marketing_sms_opt_in: bool = False