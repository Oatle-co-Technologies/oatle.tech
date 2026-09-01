from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from backend.integrations.google_calendar import (
    get_free_busy,
    create_calendar_event,
)


router = APIRouter(
    prefix="/google-calendar",
    tags=["Google Calendar"],
)


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class AvailabilityRequest(BaseModel):
    start_time: datetime
    end_time: datetime


class CalendarEventRequest(BaseModel):
    summary: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    attendee_email: EmailStr | None = None
    location: str | None = None


# ============================================================
# CHECK AVAILABILITY
# ============================================================

@router.post("/availability")
def check_availability(
    request: AvailabilityRequest,
):
    """
    Check the Oatle Technologies Google Calendar
    for busy periods.
    """

    if request.end_time <= request.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    try:
        busy_periods = get_free_busy(
            start_time=request.start_time,
            end_time=request.end_time,
        )

        return {
            "available": len(busy_periods) == 0,
            "busy": busy_periods,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google Calendar error: {str(e)}",
        )


# ============================================================
# CREATE CALENDAR EVENT
# ============================================================

@router.post("/events")
def create_event(
    request: CalendarEventRequest,
):
    """
    Create an appointment event on the
    Oatle Technologies Google Calendar.
    """

    if request.end_time <= request.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    try:
        event = create_calendar_event(
            summary=request.summary,
            description=request.description,
            start_time=request.start_time,
            end_time=request.end_time,
            attendee_email=request.attendee_email,
            location=request.location,
        )

        return {
            "message": "Calendar event created successfully",
            "event_id": event.get("id"),
            "event_link": event.get("htmlLink"),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google Calendar error: {str(e)}",
        )