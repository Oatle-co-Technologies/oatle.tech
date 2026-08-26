from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.client import Client
from backend.schemas.client import ClientCreate

router = APIRouter(prefix="/clients", tags=["Clients"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


@router.get("")
def get_clients(
    db: Session = Depends(get_db),
):
    clients = db.query(Client).all()
    return clients


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

    return {"message": "Client deleted successfully"}