from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.pricing import Product
from backend.models.product_service import ProductService
from backend.models.product_product_service import ProductProductService
from backend.schemas.product_product_service import (
    ProductProductServiceCreate,
    ProductProductServiceResponse,
)


router = APIRouter(
    prefix="/product-product-services",
    tags=["Product Product Services"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=ProductProductServiceResponse,
)
def create_product_product_service(
    association: ProductProductServiceCreate,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == association.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    product_service = (
        db.query(ProductService)
        .filter(
            ProductService.id == association.product_service_id
        )
        .first()
    )

    if not product_service:
        raise HTTPException(
            status_code=404,
            detail="Product service not found",
        )

    existing = (
        db.query(ProductProductService)
        .filter(
            ProductProductService.product_id
            == association.product_id,
            ProductProductService.product_service_id
            == association.product_service_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Product service is already associated with this product",
        )

    new_association = ProductProductService(
        product_id=association.product_id,
        product_service_id=association.product_service_id,
    )

    db.add(new_association)
    db.commit()
    db.refresh(new_association)

    return new_association


@router.get(
    "",
    response_model=list[ProductProductServiceResponse],
)
def get_product_product_services(
    db: Session = Depends(get_db),
):
    return (
        db.query(ProductProductService)
        .all()
    )


@router.get(
    "/product/{product_id}",
    response_model=list[ProductProductServiceResponse],
)
def get_product_services_for_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return (
        db.query(ProductProductService)
        .filter(
            ProductProductService.product_id == product_id
        )
        .all()
    )


@router.delete(
    "/product/{product_id}/product-service/{product_service_id}"
)
def delete_product_product_service(
    product_id: int,
    product_service_id: int,
    db: Session = Depends(get_db),
):
    association = (
        db.query(ProductProductService)
        .filter(
            ProductProductService.product_id == product_id,
            ProductProductService.product_service_id
            == product_service_id,
        )
        .first()
    )

    if not association:
        raise HTTPException(
            status_code=404,
            detail="Product service association not found",
        )

    db.delete(association)
    db.commit()

    return {
        "message": "Product service removed from product successfully"
    }