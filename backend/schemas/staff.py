from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class StaffNameUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value
