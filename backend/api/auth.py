from fastapi import APIRouter, Depends

from backend.dependencies import get_current_staff
from backend.models.staff import Staff

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.get("/me")
def get_current_user(
    staff: Staff = Depends(get_current_staff),
):
    return {
        "id": staff.id,
        "name": staff.name,
        "email": staff.email,
        "access_level": staff.access_level,
        "active": staff.active,
    }
