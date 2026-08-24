from pydantic import BaseModel


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
    active: bool = True


class ServiceResponse(ServiceCreate):
    id: int

    class Config:
        from_attributes = True