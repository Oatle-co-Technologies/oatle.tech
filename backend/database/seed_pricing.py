"""Synchronise the published catalogue after applying sql/004_standalone_service_invoices.sql."""
from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
from backend.models.pricing import AddOn, Product, Service
from backend.database.pricing_catalogue import PRODUCTS, ADDONS, SERVICES, ALIASES


def sync_catalogue(db: Session):
    """Update only listed catalogue rows; preserve IDs, inactive flags and all invoices."""
    for model, records in ((Product, PRODUCTS), (AddOn, ADDONS), (Service, SERVICES)):
        for data in records:
            item = db.query(model).filter(model.name == data["name"]).first()
            if item is None and model is Service and data["name"] in ALIASES:
                item = db.query(model).filter(model.name == ALIASES[data["name"]]).first()
            if item is None:
                db.add(model(**data))
            else:
                for key, value in data.items():
                    setattr(item, key, value)


def seed_pricing():
    db = SessionLocal()
    try:
        sync_catalogue(db)
        db.commit()
        print("October 2026 pricing catalogue synchronised successfully.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_pricing()
