from datetime import date

from pydantic import BaseModel


class TaskCreate(BaseModel):
    project_id: int
    name: str
    description: str | None = None
    category: str | None = None
    status: str = "todo"
    priority: str = "medium"
    due_date: date | None = None
    notes: str | None = None