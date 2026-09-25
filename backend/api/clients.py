from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal

from backend.models.client import Client

from backend.schemas.client import ClientCreate

from backend.services.email_service import send_lead_follow_up_email


router = APIRouter(
    prefix="/clients",
    tags=["Clients"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# CREATE CLIENT
# ============================================================

@router.post("")
def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
):

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


# ============================================================
# GET ALL CLIENTS
# ============================================================

@router.get("")
def get_clients(
    db: Session = Depends(get_db),
):

    clients = db.query(Client).all()

    return clients


# ============================================================
# GET SINGLE CLIENT
# ============================================================

@router.get("/{client_id}")
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
):

    client = (
        db.query(Client)
        .filter(Client.id == client_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found",
        )

    return client


# ============================================================
# UPDATE CLIENT
# ============================================================

@router.put("/{client_id}")
def update_client(
    client_id: int,
    client: ClientCreate,
    db: Session = Depends(get_db),
):

    existing_client = (
        db.query(Client)
        .filter(Client.id == client_id)
        .first()
    )

    if not existing_client:
        raise HTTPException(
            status_code=404,
            detail="Client not found",
        )

    existing_client.name = client.name
    existing_client.email = client.email
    existing_client.company = client.company
    existing_client.phone = client.phone

    db.commit()
    db.refresh(existing_client)

    return existing_client


# ============================================================
# SEND CLIENT EMAIL
# ============================================================

@router.post("/{client_id}/send-email")
def send_client_email(
    client_id: int,
    email_data: dict,
    db: Session = Depends(get_db),
):

    client = (
        db.query(Client)
        .filter(Client.id == client_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found",
        )

    subject = email_data.get("subject", "")
    message = email_data.get("message", "")

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

    if not client.email:
        raise HTTPException(
            status_code=400,
            detail="Client does not have an email address",
        )

    sent = send_lead_follow_up_email(
        recipient_email=client.email,
        recipient_name=client.name,
        subject=subject,
        message=message,
    )

    if not sent:
        raise HTTPException(
            status_code=502,
            detail="Failed to send email",
        )

    return {
        "message": "Email sent successfully",
        "client": client,
    }


# ============================================================
# DELETE CLIENT
# ============================================================

@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
):

    client = (
        db.query(Client)
        .filter(Client.id == client_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found",
        )

    db.delete(client)
    db.commit()

    return {
        "message": "Client deleted successfully"
    }