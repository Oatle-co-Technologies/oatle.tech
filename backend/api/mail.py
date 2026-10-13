from fastapi import APIRouter, Depends, Query, Response
from backend.dependencies import get_current_staff
from backend.models.staff import Staff
from backend.services.mailbox_service import inbox, mailbox_for, read_message

router = APIRouter(prefix="/mail", tags=["Mail"])


@router.get("/inbox")
def get_inbox(response: Response, before: int | None = Query(None, ge=1),
              staff: Staff = Depends(get_current_staff)):
    response.headers["Cache-Control"] = "no-store"
    return inbox(mailbox_for(staff), before)


@router.get("/inbox/{uid}")
def get_message(response: Response, uid: int, uid_validity: int = Query(..., ge=1),
                staff: Staff = Depends(get_current_staff)):
    from fastapi import HTTPException
    if uid < 1:
        raise HTTPException(422, "Invalid message identifier")
    response.headers["Cache-Control"] = "no-store"
    return read_message(mailbox_for(staff), uid, uid_validity)
