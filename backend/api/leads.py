from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.lead import Lead
from backend.schemas.lead import LeadCreate


router = APIRouter(prefix="/leads", tags=["Leads"])


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
):
    new_lead = Lead(
        name=lead.name,
        email=lead.email,
        company=lead.company,
        phone=lead.phone,
        source=lead.source,
        stage=lead.stage,
        response=lead.response,
        follow_up_reason=lead.follow_up_reason,
        contact_attempts=lead.contact_attempts,
        last_contacted_at=lead.last_contacted_at,
        next_follow_up_at=lead.next_follow_up_at,
        notes=lead.notes,
        marketing_email_opt_in=lead.marketing_email_opt_in,
        marketing_sms_opt_in=lead.marketing_sms_opt_in,
    )

    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return new_lead


@router.get("/")
def get_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).all()
    return leads


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

    existing_lead.name = lead.name
    existing_lead.email = lead.email
    existing_lead.company = lead.company
    existing_lead.phone = lead.phone
    existing_lead.source = lead.source
    existing_lead.stage = lead.stage
    existing_lead.response = lead.response
    existing_lead.follow_up_reason = lead.follow_up_reason
    existing_lead.contact_attempts = lead.contact_attempts
    existing_lead.last_contacted_at = lead.last_contacted_at
    existing_lead.next_follow_up_at = lead.next_follow_up_at
    existing_lead.notes = lead.notes
    existing_lead.marketing_email_opt_in = lead.marketing_email_opt_in
    existing_lead.marketing_sms_opt_in = lead.marketing_sms_opt_in

    db.commit()
    db.refresh(existing_lead)

    return existing_lead


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

    return {"message": "Lead deleted successfully"}