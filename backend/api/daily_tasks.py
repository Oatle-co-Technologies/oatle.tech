"""Campaign coordination reuses staff identities and the existing tasks table."""
from datetime import date, datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.database.connection import get_db
from backend.dependencies import get_admin_staff, get_current_staff
from backend.models.campaign_day import CampaignDay
from backend.models.staff import Staff
from backend.models.task import Task
from backend.api.tasks import validate_assignee

router = APIRouter(prefix="/daily-tasks", tags=["Daily Tasks"])
Status = Literal["todo", "in_progress", "completed", "blocked"]


class StrictInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Progress(StrictInput):
    status: Status | None = None
    notes: str | None = Field(default=None, max_length=10000)

    @field_validator("status")
    @classmethod
    def non_null_status(cls, value):
        if value is None:
            raise ValueError("Status cannot be null")
        return value


class Assignment(StrictInput):
    name: str = Field(min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=10000)
    assigned_to: int
    due_date: date | None = None
    campaign_day_id: int | None = None
    status: Status = "todo"
    notes: str | None = Field(default=None, max_length=10000)

    @field_validator("name")
    @classmethod
    def trimmed_name(cls, value):
        if not value.strip():
            raise ValueError("Task title cannot be blank")
        return value.strip()


class TaskView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None
    assigned_to: int | None
    due_date: date | None
    campaign_day_id: int | None
    status: str
    notes: str | None
    completed_at: datetime | None
    created_at: datetime | None
    updated_at: datetime | None
    created_by: int | None


class CampaignInput(StrictInput):
    focus_date: date
    industry: str = Field(min_length=1, max_length=200)
    campaign_name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)

    @field_validator("industry", "campaign_name")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("This field cannot be blank")
        return value.strip()


class CampaignView(CampaignInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


def save(db, record):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A campaign day already exists for this date, or the assignment changed. Refresh and try again.")
    db.refresh(record)
    return record


def authorised_task(task_id, db, staff):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or (staff.access_level != "admin" and task.assigned_to != staff.id):
        raise HTTPException(404, "Task not found")
    return task


def validate_assignment(payload, db):
    validate_assignee(payload.assigned_to, db)
    assignee = db.query(Staff).filter(Staff.id == payload.assigned_to).first()
    if assignee.access_level not in {"admin", "member"}:
        raise HTTPException(400, "Assignee must be an active dashboard user")
    if payload.campaign_day_id is not None:
        if not db.query(CampaignDay).filter(CampaignDay.id == payload.campaign_day_id).first():
            raise HTTPException(404, "Campaign day not found")


def set_progress(task, values):
    if "status" in values:
        status = values["status"]
        if status == "completed":
            if task.completed_at is None:
                task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None
        task.status = status
    if "notes" in values:
        task.notes = values["notes"]
    task.updated_at = datetime.utcnow()


@router.get("", response_model=list[TaskView])
def list_tasks(mine: bool = True, db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    query = db.query(Task)
    if mine or staff.access_level != "admin":
        query = query.filter(Task.assigned_to == staff.id)
    return query.order_by(Task.due_date.asc().nullslast(), Task.id.asc()).all()


@router.post("", response_model=TaskView, status_code=201)
def create_task(payload: Assignment, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    validate_assignment(payload, db)
    task = Task(**payload.model_dump(), task_type="daily", created_by=staff.id)
    set_progress(task, payload.model_dump())
    db.add(task)
    return save(db, task)


@router.patch("/{task_id}/progress", response_model=TaskView)
def update_progress(task_id: int, payload: Progress, db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    task = authorised_task(task_id, db, staff)
    set_progress(task, payload.model_dump(exclude_unset=True))
    return save(db, task)


@router.put("/{task_id}", response_model=TaskView)
def edit_task(task_id: int, payload: Assignment, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    task = authorised_task(task_id, db, staff)
    validate_assignment(payload, db)
    values = payload.model_dump()
    for key in ("name", "description", "assigned_to", "due_date", "campaign_day_id"):
        setattr(task, key, values[key])
    set_progress(task, values)
    return save(db, task)


@router.post("/{task_id}/duplicate", response_model=TaskView, status_code=201)
def duplicate_task(task_id: int, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    source = authorised_task(task_id, db, staff)
    task = Task(name=source.name + " (copy)", description=source.description,
                assigned_to=source.assigned_to, due_date=source.due_date,
                campaign_day_id=source.campaign_day_id, task_type="daily",
                status="todo", created_by=staff.id)
    db.add(task)
    return save(db, task)


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    task = authorised_task(task_id, db, staff)
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@router.get("/campaigns/schedule", response_model=list[CampaignView])
def list_campaigns(db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    return db.query(CampaignDay).order_by(CampaignDay.focus_date.asc()).all()


@router.post("/campaigns/schedule", response_model=CampaignView, status_code=201)
def create_campaign(payload: CampaignInput, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    record = CampaignDay(**payload.model_dump())
    db.add(record)
    return save(db, record)


@router.put("/campaigns/schedule/{campaign_id}", response_model=CampaignView)
def edit_campaign(campaign_id: int, payload: CampaignInput, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    record = db.query(CampaignDay).filter(CampaignDay.id == campaign_id).first()
    if not record:
        raise HTTPException(404, "Campaign day not found")
    for key, value in payload.model_dump().items():
        setattr(record, key, value)
    record.updated_at = datetime.utcnow()
    return save(db, record)


class Setup(StrictInput):
    founder_id: int
    kat_id: int
    colin_id: int


@router.post("/campaigns/initial-setup")
def initial_setup(payload: Setup, db: Session = Depends(get_db), staff: Staff = Depends(get_admin_staff)):
    from backend.services.campaign_setup import seed_campaign
    people = [payload.founder_id, payload.kat_id, payload.colin_id]
    if len(set(people)) != 3:
        raise HTTPException(400, "Select three different team members")
    for person in people:
        validate_assignee(person, db)
        record = db.query(Staff).filter(Staff.id == person).first()
        if record.access_level not in {"admin", "member"}:
            raise HTTPException(400, "Select active dashboard users")
    founder = db.query(Staff).filter(Staff.id == payload.founder_id).first()
    if founder.access_level != "admin":
        raise HTTPException(400, "Founder must be an administrator")
    # A transaction-level lock prevents concurrent setup requests creating duplicates.
    from sqlalchemy import text
    db.execute(text("SELECT pg_advisory_xact_lock(20261010)"))
    result = seed_campaign(db, payload.founder_id, payload.kat_id, payload.colin_id, staff.id)
    db.commit()
    return result
