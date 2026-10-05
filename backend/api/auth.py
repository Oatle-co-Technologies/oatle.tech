from fastapi import APIRouter, Depends, Request

from backend.dependencies import get_current_staff, get_db, is_financial_owner
from backend.models.staff import Staff
from backend.schemas.staff import StaffNameUpdate
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.get("/me")
def get_current_user(
    request: Request,
    staff: Staff = Depends(get_current_staff),
):
    return {
        "id": staff.id,
        "name": staff.name,
        "email": staff.email,
        "access_level": staff.access_level,
        "active": staff.active,
        "is_owner": is_financial_owner(request),
    }


@router.patch("/me")
def update_current_user(
    profile: StaffNameUpdate,
    request: Request,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    staff.name = profile.name
    db.commit()
    db.refresh(staff)
    return get_current_user(request, staff)
