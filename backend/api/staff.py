from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.staff import Staff
from backend.schemas.staff import StaffCreate, StaffResponse


router = APIRouter(
    prefix="/staff",
    tags=["Staff"],
)


@router.post("", response_model=StaffResponse)
def create_staff(
    staff: StaffCreate,
    db: Session = Depends(get_db),
):
    existing_email = (
        db.query(Staff)
        .filter(Staff.email == staff.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="A staff member with this email already exists",
        )

    new_staff = Staff(
        name=staff.name,
        email=staff.email,
        job_title=staff.job_title,
        access_level=staff.access_level,
        employment_type=staff.employment_type,
        is_temporary=staff.is_temporary,
        active=staff.active,
    )

    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    return new_staff


@router.get(
    "",
    response_model=list[StaffResponse],
)
def get_staff(
    db: Session = Depends(get_db),
):
    return (
        db.query(Staff)
        .order_by(Staff.name.asc())
        .all()
    )


@router.get(
    "/{staff_id}",
    response_model=StaffResponse,
)
def get_staff_member(
    staff_id: int,
    db: Session = Depends(get_db),
):
    staff = (
        db.query(Staff)
        .filter(Staff.id == staff_id)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=404,
            detail="Staff member not found",
        )

    return staff


@router.put(
    "/{staff_id}",
    response_model=StaffResponse,
)
def update_staff(
    staff_id: int,
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
):
    staff = (
        db.query(Staff)
        .filter(Staff.id == staff_id)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=404,
            detail="Staff member not found",
        )

    existing_email = (
        db.query(Staff)
        .filter(
            Staff.email == staff_data.email,
            Staff.id != staff_id,
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="A staff member with this email already exists",
        )

    staff.name = staff_data.name
    staff.email = staff_data.email
    staff.job_title = staff_data.job_title
    staff.access_level = staff_data.access_level
    staff.employment_type = staff_data.employment_type
    staff.is_temporary = staff_data.is_temporary
    staff.active = staff_data.active

    db.commit()
    db.refresh(staff)

    return staff


@router.delete("/{staff_id}")
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
):
    staff = (
        db.query(Staff)
        .filter(Staff.id == staff_id)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=404,
            detail="Staff member not found",
        )

    db.delete(staff)
    db.commit()

    return {
        "message": "Staff member deleted successfully"
    }