from pydantic import BaseModel, ConfigDict


class StaffCreate(BaseModel):
    name: str
    email: str
    job_title: str | None = None
    access_level: str = "member"
    employment_type: str = "employee"
    is_temporary: bool = False
    active: bool = True


class StaffResponse(StaffCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
