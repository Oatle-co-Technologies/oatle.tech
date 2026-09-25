from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
from backend.models.client import Client
from backend.schemas.client import ClientCreate
from backend.services.email_service import send_lead_follow_up_email

router = APIRouter(prefix="/clients", tags=["Clients"])

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
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    new_client = Client(
        name=client.name,
        email=client.email,
        company=client.company,
        phone=client.phone,
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.get("")
def get_clients(db: Session = Depends(get_db)):
    return db.query(Client).all()

@router.get("/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/{client_id}")
def update_client(
    client_id: int,
    client: ClientCreate,
    db: Session = Depends(get_db),
):
    existing_client = db.query(Client).filter(Client.id == client_id).first()
    if not existing_client:
        raise HTTPException(status_code=404, detail="Client not found")

    existing_client.name = client.name
    existing_client.email = client.email
    existing_client.company = client.company
    existing_client.phone = client.phone

    db.commit()
    db.refresh(existing_client)
    return existing_client

@router.post("/{client_id}/send-email")
async def send_client_email(
    client_id: int,
    subject: str = Form(...),
    message: str = Form(...),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if not subject.strip():
        raise HTTPException(status_code=400, detail="Email subject is required")
    if not message.strip():
        raise HTTPException(status_code=400, detail="Email message is required")
    if not client.email:
        raise HTTPException(status_code=400, detail="Client does not have an email address")

    attachments = []

    for upload in files:
        if upload.content_type not in ALLOWED_ATTACHMENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported attachment type: {upload.filename}",
            )

        content = await upload.read()

        if len(content) > MAX_ATTACHMENT_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Attachment is too large: {upload.filename}. Maximum size is 10 MB.",
            )

        attachments.append({
            "name": upload.filename or "attachment",
            "content": content,
        })

    sent = send_lead_follow_up_email(
        recipient_email=client.email,
        recipient_name=client.name,
        subject=subject,
        message=message,
        attachments=attachments,
    )

    if not sent:
        raise HTTPException(status_code=502, detail="Failed to send email")

    return {"message": "Email sent successfully", "client": client}

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}
