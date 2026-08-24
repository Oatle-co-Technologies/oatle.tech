from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):
    project_id: int | None = None

    product_service_id: int | None = None

    service_id: int | None = None

    assigned_to: int | None = None

    task_type: str = "product"

    name: str

    description: str | None = None

    category: str | None = None

    status: str = "todo"

    priority: str = "medium"

    due_date: date | None = None

    notes: str | None = None


class TaskResponse(TaskCreate):
    id: int

    created_at: datetime | None = None

    completed_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )