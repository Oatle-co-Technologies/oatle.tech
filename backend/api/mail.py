from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, File, Form, UploadFile, HTTPException
from pydantic import ValidationError
import mimetypes
import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from backend.dependencies import get_current_staff
from backend.models.staff import Staff
from backend.services.mailbox_service import inbox, mailbox_for, read_message, send_message, mark_message_read, conversation

router = APIRouter(prefix="/mail", tags=["Mail"])


@router.get("/inbox")
def get_inbox(response: Response, before: int | None = Query(None, ge=1),
              staff: Staff = Depends(get_current_staff), view: Literal["inbox", "unread", "sent"] = "inbox", q: str = Query("", max_length=200, pattern=r"^[^\r\n]*$")):
    response.headers["Cache-Control"] = "no-store"
    return inbox(mailbox_for(staff), before, view=view, search=q.strip())


@router.get("/inbox/{uid}")
def get_message(response: Response, uid: int, uid_validity: int = Query(..., ge=1),
                staff: Staff = Depends(get_current_staff), view: Literal["inbox", "unread", "sent"] = "inbox"):
    from fastapi import HTTPException
    if uid < 1:
        raise HTTPException(422, "Invalid message identifier")
    response.headers["Cache-Control"] = "no-store"
    return read_message(mailbox_for(staff), uid, uid_validity, view=view)


class ReplyContext(BaseModel):
    model_config = ConfigDict(extra="forbid")
    uid: int = Field(ge=1)
    uid_validity: int = Field(ge=1)
    view: Literal["inbox", "unread", "sent"] = "inbox"


class OutgoingMail(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reply: ReplyContext | None = None
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
    return send_message(mailbox_for(staff), str(payload.recipient), payload.subject, payload.body, reply=payload.reply.model_dump() if payload.reply else None)


@router.post("/inbox/{uid}/read")
def mark_read(response: Response, uid: int, uid_validity: int = Query(..., ge=1),
              staff: Staff = Depends(get_current_staff), view: Literal["inbox", "unread", "sent"] = "inbox"):
    from fastapi import HTTPException
    if uid < 1:
        raise HTTPException(422, "Invalid message identifier")
    response.headers["Cache-Control"] = "no-store"
    return mark_message_read(mailbox_for(staff), uid, uid_validity, view=view)


@router.get("/inbox/{uid}/conversation")
def get_conversation(response: Response, uid: int, uid_validity: int = Query(..., ge=1),
                     staff: Staff = Depends(get_current_staff), view: Literal["inbox", "unread", "sent"] = "inbox"):
    from fastapi import HTTPException
    if uid < 1:
        raise HTTPException(422, "Invalid message identifier")
    response.headers["Cache-Control"] = "no-store"
    return conversation(mailbox_for(staff), uid, uid_validity, view=view)


MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024
MAX_ATTACHMENTS = 10


@router.post("/send-with-attachments")
def send_with_attachments(response: Response, payload: str = Form(..., max_length=1024 * 1024),
                          attachments: list[UploadFile] = File(default=[]),
                          staff: Staff = Depends(get_current_staff)):
    response.headers["Cache-Control"] = "no-store"
    try:
        try:
            mail = OutgoingMail.model_validate_json(payload)
        except ValidationError:
            raise HTTPException(422, "Please check the recipient, subject, and message.") from None
        box = mailbox_for(staff)
        if len(attachments) > MAX_ATTACHMENTS:
            raise HTTPException(413, "Attach up to 10 files per email.")
        files, total = [], 0
        for upload in attachments:
            filename = re.split(r"[\\/]", upload.filename or "")[-1]
            if not filename.strip() or len(filename) > 255 or any(ord(c) < 32 or ord(c) == 127 for c in filename):
                raise HTTPException(422, "An attachment has an invalid filename. Rename it and try again.")
            data = upload.file.read(MAX_ATTACHMENT_BYTES - total + 1)
            total += len(data)
            if total > MAX_ATTACHMENT_BYTES:
                raise HTTPException(413, "Attachments must total 3 MB or less.")
            content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            files.append({"filename": filename, "data": data, "content_type": content_type})
        return send_message(box, str(mail.recipient), mail.subject, mail.body,
                            reply=mail.reply.model_dump() if mail.reply else None, attachments=files)
    finally:
        for upload in attachments:
            upload.file.close()
