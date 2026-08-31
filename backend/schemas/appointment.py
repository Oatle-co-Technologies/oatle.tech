from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AppointmentCreate(BaseModel):
    organizer_staff_id: int | None = None
    participant_staff_id: int | None = None

    participant_name: str
    participant_email: str

    title: str
    appointment_type: str = "general"

    start_time: datetime
    end_time: datetime

    location: str | None = None
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    participant_name: str | None = None
    participant_email: str | None = None

    title: str | None = None
    appointment_type: str | None = None

    start_time: datetime | None = None
    end_time: datetime | None = None

    status: str | None = None
    location: str | None = None
    notes: str | None = None


class AppointmentResponse(AppointmentCreate):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)