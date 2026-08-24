from pydantic import BaseModel


class ProductProductServiceCreate(BaseModel):
    product_id: int
    product_service_id: int


class ProductProductServiceResponse(BaseModel):
    product_id: int
    product_service_id: int

    class Config:
        from_attributes = True