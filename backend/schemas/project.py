from datetime import date

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    client_id: int
    product_id: int

    name: str

    website: str | None = None

    # Kept temporarily for existing project compatibility.
    plan: str

    description: str | None = None

    status: str = "planning"

    target_date: date | None = None

    notes: str | None = None