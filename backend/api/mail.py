from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from backend.dependencies import get_current_staff
from backend.models.staff import Staff
from backend.services.mailbox_service import inbox, mailbox_for, read_message, send_message

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


class OutgoingMail(BaseModel):
    model_config = ConfigDict(extra="forbid")
    recipient: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=100000)

    @field_validator("subject")
    @classmethod
    def valid_subject(cls, value):
        if "\n" in value or "\r" in value or not value.strip():
            raise ValueError("Enter a subject without line breaks")
        return value


@router.post("/send")
def send_mail(payload: OutgoingMail, response: Response,
              staff: Staff = Depends(get_current_staff)):
    response.headers["Cache-Control"] = "no-store"
    return send_message(mailbox_for(staff), str(payload.recipient), payload.subject, payload.body)
