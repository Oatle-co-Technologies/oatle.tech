from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.appointment import Appointment
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

    db.delete(appointment)
    db.commit()

    return {
        "message": "Appointment deleted successfully"
    }