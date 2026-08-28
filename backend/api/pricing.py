from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.models.pricing import AddOn, Product, Service
from backend.schemas.pricing import (
    AddOnCreate,
    AddOnResponse,
    ProductCreate,
    ProductResponse,
    ServiceCreate,
    ServiceResponse,
)


router = APIRouter(
    prefix="/pricing",
    tags=["Pricing"],
)


# -------------------------
# Products
# -------------------------

@router.get(
    "/products",
    response_model=list[ProductResponse],
)
def get_products(
    db: Session = Depends(get_db),
):
    return (
        db.query(Product)
        .filter(Product.active == True)
        .order_by(Product.name)
        .all()
    )


@router.post(
    "/products",
    response_model=ProductResponse,
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Product)
        .filter(Product.name == product.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Product already exists",
        )

    new_product = Product(
        name=product.name,
        description=product.description,
        base_price=product.base_price,
        pricing_type=product.pricing_type,
        active=product.active,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# -------------------------
# Add-ons
# -------------------------

@router.get(
    "/addons",
    response_model=list[AddOnResponse],
)
def get_addons(
    db: Session = Depends(get_db),
):
    return (
        db.query(AddOn)
        .filter(AddOn.active == True)
        .order_by(AddOn.name)
        .all()
    )


@router.post(
    "/addons",
    response_model=AddOnResponse,
)
def create_addon(
    addon: AddOnCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(AddOn)
        .filter(AddOn.name == addon.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Add-on already exists",
        )

    new_addon = AddOn(
        name=addon.name,
        description=addon.description,
        price=addon.price,
        active=addon.active,
    )

    db.add(new_addon)
    db.commit()
    db.refresh(new_addon)

    return new_addon


# -------------------------
# Services
# -------------------------

@router.get(
    "/services",
    response_model=list[ServiceResponse],
)
def get_services(
    db: Session = Depends(get_db),
):
    return (
        db.query(Service)
        .filter(Service.active == True)
        .order_by(Service.name)
        .all()
    )


@router.post(
    "/services",
    response_model=ServiceResponse,
)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Service)
        .filter(Service.name == service.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Service already exists",
        )

    new_service = Service(
        name=service.name,
        description=service.description,
        active=service.active,
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return new_service