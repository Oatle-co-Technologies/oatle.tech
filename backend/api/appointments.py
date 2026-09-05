from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.appointment import Appointment
from backend.integrations.google_calendar import (
    create_calendar_event,
    delete_calendar_event,
    update_calendar_event,
)
from backend.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
)


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


# ============================================================
# CREATE APPOINTMENT
# ============================================================

@router.post(
    "",
    response_model=AppointmentResponse,
)
def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
):
    if appointment.end_time <= appointment.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    conflicting_appointment = (
        db.query(Appointment)
        .filter(
            Appointment.status != "cancelled",
            Appointment.start_time < appointment.end_time,
            Appointment.end_time > appointment.start_time,
        )
        .first()
    )

    if conflicting_appointment:
        raise HTTPException(
            status_code=409,
            detail="The selected time is already booked",
        )

    new_appointment = Appointment(
        organizer_staff_id=appointment.organizer_staff_id,
        participant_staff_id=appointment.participant_staff_id,
        participant_name=appointment.participant_name,
        participant_email=appointment.participant_email,
        title=appointment.title,
        appointment_type=appointment.appointment_type,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        location=appointment.location,
        notes=appointment.notes,
    )

    try:
        calendar_event = create_calendar_event(
            summary=appointment.title,
            description=appointment.notes,
            start_time=appointment.start_time,
            end_time=appointment.end_time,
            attendee_email=appointment.participant_email,
            location=appointment.location,
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not create Google Calendar event: {error}",
        ) from error

    new_appointment.google_event_id = calendar_event.get("id")

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return new_appointment


# ============================================================
# GET APPOINTMENTS
# ============================================================

@router.get(
    "",
    response_model=list[AppointmentResponse],
)
def get_appointments(
    db: Session = Depends(get_db),
):
    return (
        db.query(Appointment)
        .order_by(Appointment.start_time.asc())
        .all()
    )


# ============================================================
# GET SINGLE APPOINTMENT
# ============================================================

@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    return appointment


# ============================================================
# UPDATE APPOINTMENT
# ============================================================

@router.put(
    "/{appointment_id}",
    response_model=AppointmentResponse,
)
def update_appointment(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    update_data = appointment_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(appointment, field, value)

    if appointment.end_time <= appointment.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    conflicting_appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id != appointment_id,
            Appointment.status != "cancelled",
            Appointment.start_time < appointment.end_time,
            Appointment.end_time > appointment.start_time,
        )
        .first()
    )

    if conflicting_appointment:
        raise HTTPException(
            status_code=409,
            detail="The selected time is already booked",
        )

    try:
        if appointment.google_event_id:
            update_calendar_event(
                event_id=appointment.google_event_id,
                summary=appointment.title,
                description=appointment.notes,
                start_time=appointment.start_time,
                end_time=appointment.end_time,
                attendee_email=appointment.participant_email,
                location=appointment.location,
            )
        else:
            calendar_event = create_calendar_event(
                summary=appointment.title,
                description=appointment.notes,
                start_time=appointment.start_time,
                end_time=appointment.end_time,
                attendee_email=appointment.participant_email,
                location=appointment.location,
            )
            appointment.google_event_id = calendar_event.get("id")
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"Could not sync Google Calendar event: {error}",
        ) from error

    db.commit()
    db.refresh(appointment)

    return appointment


# ============================================================
# DELETE APPOINTMENT
# ============================================================

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    if appointment.google_event_id:
        try:
            delete_calendar_event(appointment.google_event_id)
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail=f"Could not delete Google Calendar event: {error}",
            ) from error

    db.delete(appointment)
    db.commit()

    return {
        "message": "Appointment deleted successfully"
    }