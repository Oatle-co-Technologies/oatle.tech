from datetime import date, datetime

from pydantic import BaseModel


class InvoiceCreate(BaseModel):
    client_id: int
    project_id: int | None = None

    discount_percent: float = 0

    status: str = "draft"
    issue_date: date
    due_date: date | None = None
    notes: str | None = None


class InvoiceUpdate(BaseModel):
    client_id: int
    project_id: int | None = None

    discount_percent: float = 0

    status: str
    issue_date: date
    due_date: date | None = None
    notes: str | None = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    client_id: int
    project_id: int | None

    discount_percent: float
    amount: float

    status: str
    issue_date: date
    due_date: date | None
    notes: str | None
    paid_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True