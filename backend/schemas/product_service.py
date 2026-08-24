from pydantic import BaseModel


class ProductServiceCreate(BaseModel):
    name: str
    description: str | None = None
    active: bool = True