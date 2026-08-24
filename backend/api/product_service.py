from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.product_service import ProductService
from backend.schemas.product_service import ProductServiceCreate



router = APIRouter(
    prefix="/product-services",
    tags=["Product Services"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_product_service(
    product_service: ProductServiceCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(ProductService)
        .filter(ProductService.name == product_service.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Product service already exists",
        )

    new_product_service = ProductService(
        name=product_service.name,
        description=product_service.description,
        active=product_service.active,
    )

    db.add(new_product_service)
    db.commit()
    db.refresh(new_product_service)

    return new_product_service


@router.get("/")
def get_product_services(
    db: Session = Depends(get_db),
):
    return db.query(ProductService).all()


@router.get("/{product_service_id}")
def get_product_service(
    product_service_id: int,
    db: Session = Depends(get_db),
):
    product_service = (
        db.query(ProductService)
        .filter(ProductService.id == product_service_id)
        .first()
    )

    if not product_service:
        raise HTTPException(
            status_code=404,
            detail="Product service not found",
        )

    return product_service


@router.put("/{product_service_id}")
def update_product_service(
    product_service_id: int,
    product_service: ProductServiceCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(ProductService)
        .filter(ProductService.id == product_service_id)
        .first()
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Product service not found",
        )

    existing.name = product_service.name
    existing.description = product_service.description
    existing.active = product_service.active

    db.commit()
    db.refresh(existing)

    return existing


@router.delete("/{product_service_id}")
def delete_product_service(
    product_service_id: int,
    db: Session = Depends(get_db),
):
    product_service = (
        db.query(ProductService)
        .filter(ProductService.id == product_service_id)
        .first()
    )

    if not product_service:
        raise HTTPException(
            status_code=404,
            detail="Product service not found",
        )

    db.delete(product_service)
    db.commit()

    return {
        "message": "Product service deleted successfully"
    }