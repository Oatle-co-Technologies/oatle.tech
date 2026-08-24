from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from backend.database.base import Base


class ProjectAddOn(Base):
    __tablename__ = "project_addons"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    addon_id = Column(
        Integer,
        ForeignKey("addons.id", ondelete="CASCADE"),
        nullable=False,
    )

    price_at_selection = Column(
        Numeric(10, 2),
        nullable=False,
    )

    project = relationship(
        "Project",
        back_populates="project_addons",
    )

    addon = relationship(
        "AddOn",
    )