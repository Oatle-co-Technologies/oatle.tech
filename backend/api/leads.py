from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.lead import Lead
from backend.schemas.lead import LeadCreate
from backend.services.email_service import send_lead_follow_up_email


router = APIRouter(
    prefix="/leads",
    tags=["Leads"],
)


MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

ALLOWED_ATTACHMENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
}


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("")
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
):
    new_lead = Lead(
        **lead.model_dump()
    )

    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return new_lead


@router.get("")
def get_leads(
    db: Session = Depends(get_db),
):
    return db.query(Lead).all()


@router.get("/{lead_id}")
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    return lead


@router.put("/{lead_id}")
def update_lead(
    lead_id: int,
    lead: LeadCreate,
    db: Session = Depends(get_db),
):
    existing_lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not existing_lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    for field, value in lead.model_dump().items():
        setattr(
            existing_lead,
            field,
            value,
        )

    db.commit()
    db.refresh(existing_lead)

    return existing_lead


@router.post("/{lead_id}/send-email")
async def send_lead_email(
    lead_id: int,
    subject: str = Form(...),
    message: str = Form(...),
    files: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    if not subject.strip():
        raise HTTPException(
            status_code=400,
            detail="Email subject is required",
        )

    if not message.strip():
        raise HTTPException(
            status_code=400,
            detail="Email message is required",
        )

    if not lead.email:
        raise HTTPException(
            status_code=400,
            detail="Lead does not have an email address",
        )

    attachments = []

    for upload in files or []:
        if not upload.filename:
            continue

        content = await upload.read()

        if len(content) > MAX_ATTACHMENT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Attachment is too large: {upload.filename}. "
                    "Maximum size is 10 MB."
                ),
            )

        if upload.content_type not in ALLOWED_ATTACHMENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported attachment type: "
                    f"{upload.filename}"
                ),
            )

        attachments.append(
            {
                "name": upload.filename,
                "content": content,
            }
        )

    sent = send_lead_follow_up_email(
        recipient_email=lead.email,
        recipient_name=lead.name,
        subject=subject,
        message=message,
        attachments=attachments,
    )

    if not sent:
        raise HTTPException(
            status_code=502,
            detail="Failed to send email",
        )

    # Sending an email counts as a contact attempt,
    # matching the existing lead follow-up behaviour.
    lead.contact_attempts = (
        lead.contact_attempts + 1
    )

    lead.last_contacted_at = datetime.utcnow()
    lead.stage = "contacted"

    db.commit()
    db.refresh(lead)

    return {
        "message": "Email sent successfully",
        "lead": lead,
    }


@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    db.delete(lead)
    db.commit()

    return {
        "message": "Lead deleted successfully"
    }
