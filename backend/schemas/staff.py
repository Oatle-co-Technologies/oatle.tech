from uuid import UUID

from pydantic import BaseModel


class StaffCreate(BaseModel):
    auth_user_id: UUID | None = None
    name: str
    email: str
    job_title: str | None = None
    access_level: str = "member"
    employment_type: str = "employee"
    is_temporary: bool = False
    active: bool = True