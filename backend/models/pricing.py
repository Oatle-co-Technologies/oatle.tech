from sqlalchemy import Boolean, Column, Float, Integer, String, Text

from backend.database.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
        unique=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    base_price = Column(
        Float,
        nullable=True,
    )

    pricing_type = Column(
        String(50),
        nullable=False,
        default="fixed",
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )


class AddOn(Base):
    __tablename__ = "addons"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
        unique=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    price = Column(
        Float,
        nullable=False,
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )


class Service(Base):
    __tablename__ = "services"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
        unique=True,
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