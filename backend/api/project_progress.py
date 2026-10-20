from datetime import date, datetime
from zoneinfo import ZoneInfo
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.dependencies import get_current_staff
from backend.models.project import Project
from backend.models.project_progress import ProjectProgress, ProjectProgressEvent
from backend.models.task import Task
from backend.models.staff import Staff
from backend.services.campaign_tasks import campaign_task_filter

router = APIRouter(prefix="/project-progress", tags=["Project progress"])
FIELDS = ("phase", "current_update", "waiting_for", "hold_reason", "expected_input", "next_action", "delivery_choice", "follow_up_date")


class ProgressUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["planning", "active", "waiting_for_client", "on_hold", "completed", "cancelled"]
    phase: Literal["brief", "design", "client_input", "delivery"] = "brief"
    current_update: str | None = Field(None, max_length=3000)
    waiting_for: str | None = Field(None, max_length=1000)
    hold_reason: str | None = Field(None, max_length=1000)
    expected_input: str | None = Field(None, max_length=250)
    next_action: str | None = Field(None, max_length=1000)
    delivery_choice: str | None = Field(None, max_length=250)
    follow_up_date: date | None = None
    linked_task_id: int | None = Field(None, ge=1)
    @model_validator(mode="after")
    def validate_waiting(self):
        for field in FIELDS:
            value = getattr(self, field)
            if isinstance(value, str) and field != "phase":
                setattr(self, field, value.strip() or None)
        if self.status == "on_hold" and not self.hold_reason:
            raise ValueError("Enter the reason this project is on hold")
        if self.status == "waiting_for_client" and not self.waiting_for:
            raise ValueError("Enter what you are waiting for from the client")
        return self


def find_project(db, project_id):
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(404, "Project not found")
    return project


def can_edit(db, project_id, staff):
    return staff.access_level == "admin" or db.query(Task.id).filter(Task.project_id == project_id, Task.assigned_to == staff.id).first() is not None


def details(db, project, staff):
    progress = db.get(ProjectProgress, project.id)
    linked = db.query(Task).filter(Task.project_id == project.id)
    available = db.query(Task).filter(Task.project_id.is_(None), ~campaign_task_filter())
    if staff.access_level != "admin":
        linked = linked.filter(Task.assigned_to == staff.id)
        available = available.filter(Task.assigned_to == staff.id)
    events = db.query(ProjectProgressEvent, Staff.name).outerjoin(Staff, ProjectProgressEvent.staff_id == Staff.id).filter(ProjectProgressEvent.project_id == project.id).order_by(ProjectProgressEvent.created_at.desc(), ProjectProgressEvent.id.desc()).limit(30).all()
    def task_data(task):
        return {"id": task.id, "name": task.name, "status": task.status, "assigned_to": task.assigned_to, "due_date": task.due_date}
    return {"project_id": project.id, "status": project.status, "can_edit": can_edit(db, project.id, staff),
            "progress": {key: getattr(progress, key) if progress else ("brief" if key == "phase" else None) for key in FIELDS},
            "tasks": [task_data(task) for task in linked.order_by(Task.created_at).all()],
            "available_tasks": [task_data(task) for task in available.order_by(Task.created_at.desc()).limit(100).all()] if can_edit(db, project.id, staff) else [],
            "history": [{"id": event.id, "created_at": event.created_at, "by": name or "Team member", "snapshot": event.snapshot} for event, name in events]}


@router.get("/summary")
def summary(response: Response, db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    response.headers["Cache-Control"] = "no-store"
    today = datetime.now(ZoneInfo("Africa/Johannesburg")).date()
    rows = db.query(Project, ProjectProgress).outerjoin(ProjectProgress, Project.id == ProjectProgress.project_id).all()
    result = {"waiting_on_clients": 0, "on_hold": 0, "followups_due": 0, "ready_to_continue": 0}
    for project, progress in rows:
        if project.status in {"completed", "cancelled"}:
            continue
        result["waiting_on_clients"] += project.status == "waiting_for_client"
        result["on_hold"] += project.status == "on_hold"
        if progress:
            result["followups_due"] += bool(progress.follow_up_date and progress.follow_up_date <= today)
            result["ready_to_continue"] += bool(project.status == "active" and not progress.waiting_for and progress.next_action)
    return result


@router.get("/{project_id}")
def get_progress(project_id: int, response: Response, db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    response.headers["Cache-Control"] = "no-store"
    return details(db, find_project(db, project_id), staff)


@router.put("/{project_id}")
def update_progress(project_id: int, payload: ProgressUpdate, response: Response,
                    db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    response.headers["Cache-Control"] = "no-store"
    project = find_project(db, project_id)
    if not can_edit(db, project_id, staff):
        raise HTTPException(403, "Only an administrator or an assigned team member can update project progress")
    task = None
    if payload.linked_task_id:
        task = db.get(Task, payload.linked_task_id)
        if task is None or (staff.access_level != "admin" and task.assigned_to != staff.id):
            raise HTTPException(404, "Task not found")
        if task.project_id not in {None, project_id}:
            raise HTTPException(409, "This task already belongs to another project")
        if db.query(Task.id).filter(Task.id == task.id, campaign_task_filter()).first():
            raise HTTPException(422, "Campaign assignments cannot be linked as project work")
    progress = db.get(ProjectProgress, project_id)
    if progress is None:
        progress = ProjectProgress(project_id=project_id)
        db.add(progress)
    before = {"status": project.status, **{key: str(getattr(progress, key)) if isinstance(getattr(progress, key), date) else getattr(progress, key) for key in FIELDS}}
    project.status = payload.status
    for field in FIELDS:
        setattr(progress, field, getattr(payload, field))
    snapshot = {"status": project.status, **{key: str(getattr(progress, key)) if isinstance(getattr(progress, key), date) else getattr(progress, key) for key in FIELDS}}
    if task and task.project_id is None:
        task.project_id = project_id
        snapshot["linked_task"] = task.name
    if snapshot != before:
        db.add(ProjectProgressEvent(project_id=project_id, staff_id=staff.id, snapshot=snapshot))
    db.commit()
    return details(db, project, staff)
