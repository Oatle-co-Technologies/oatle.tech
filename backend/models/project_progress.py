from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, JSON, DDL, event, text
from backend.database.base import Base


class ProjectProgress(Base):
    __tablename__ = "project_progress"
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    phase = Column(String(30), nullable=False, default="brief")
    current_update = Column(Text, nullable=True)
    waiting_for = Column(Text, nullable=True)
    hold_reason = Column(Text, nullable=True)
    expected_input = Column(String(250), nullable=True)
    next_action = Column(Text, nullable=True)
    delivery_choice = Column(String(250), nullable=True)
    follow_up_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProjectProgressEvent(Base):
    __tablename__ = "project_progress_events"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    snapshot = Column(JSON, nullable=False)


for model in (ProjectProgress, ProjectProgressEvent):
    event.listen(model.__table__, "after_create", DDL(
        f"ALTER TABLE public.{model.__tablename__} ENABLE ROW LEVEL SECURITY"
    ).execute_if(dialect="postgresql"))


def ensure_project_progress_schema(engine):
    # Apply only these additive tables using the deployed database connection.
    # Serialize cold starts so two workers cannot create the same table at once.
    with engine.begin() as connection:
        if connection.dialect.name == "postgresql":
            connection.execute(text("SELECT pg_advisory_xact_lock(2026101501)"))
        ProjectProgress.__table__.create(connection, checkfirst=True)
        ProjectProgressEvent.__table__.create(connection, checkfirst=True)
