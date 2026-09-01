from pydantic import BaseModel


class GoogleCalendarStatus(BaseModel):
    connected: bool
    google_email: str | None = None


class GoogleCalendarAvailability(BaseModel):
    start_time: str
    end_time: str
    available: bool


class GoogleCalendarEvent(BaseModel):
    appointment_id: int
    google_event_id: str