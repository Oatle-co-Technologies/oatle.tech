from datetime import date

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    client_id: int
    name: str
    website: str | None = None
    plan: str
    description: str | None = None
    status: str = "planning"
    target_date: date | None = None
    notes: str | None = None