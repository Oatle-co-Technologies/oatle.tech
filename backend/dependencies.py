from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.staff import Staff


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_staff(
    request: Request,
    db: Session = Depends(get_db),
) -> Staff:
    email = request.headers.get("X-User-Email", "").strip().lower()

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Missing user email",
        )

    staff = (
        db.query(Staff)
        .filter(Staff.email == email)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    if not staff.active:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    return staff


def get_admin_staff(
    staff: Staff = Depends(get_current_staff),
) -> Staff:
    if staff.access_level != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return staff
