from typing import Literal
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    base_price: float | None = None
    pricing_type: str = "fixed"
    active: bool = True


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True


class AddOnCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    active: bool = True


class AddOnResponse(AddOnCreate):
    id: int

    class Config:
        from_attributes = True


class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    base_price: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    pricing_type: Literal["fixed", "starting", "quoted"] = "quoted"
    billing_period: Literal["month"] | None = None
    active: bool = True


class ServiceResponse(ServiceCreate):
    id: int

    class Config:
        from_attributes = True
