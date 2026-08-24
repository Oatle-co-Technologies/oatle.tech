from sqlalchemy import Boolean, Column, Integer, String, Text

from backend.database.base import Base


class ProductService(Base):
    __tablename__ = "product_services"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )