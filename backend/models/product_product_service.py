from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship

from backend.database.base import Base


class ProductProductService(Base):
    __tablename__ = "product_product_services"

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        primary_key=True,
        nullable=False,
    )

    product_service_id = Column(
        Integer,
        ForeignKey("product_services.id"),
        primary_key=True,
        nullable=False,
    )

    product = relationship("Product")

    product_service = relationship("ProductService")