from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.project import Project
from backend.models.task import Task
from backend.schemas.task import TaskCreate


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == task.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    new_task = Task(
        project_id=task.project_id,
        name=task.name,
        description=task.description,
        category=task.category,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        notes=task.notes,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/")
def get_tasks(
    db: Session = Depends(get_db),
):
    tasks = db.query(Task).all()

    return tasks


@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task


@router.put("/{task_id}")
def update_task(
    task_id: int,
    task: TaskCreate,
    db: Session = Depends(get_db),
):
    existing_task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not existing_task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    project = (
        db.query(Project)
        .filter(Project.id == task.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    existing_task.project_id = task.project_id
    existing_task.name = task.name
    existing_task.description = task.description
    existing_task.category = task.category
    existing_task.status = task.status
    existing_task.priority = task.priority
    existing_task.due_date = task.due_date
    existing_task.notes = task.notes

    if task.status == "completed":
        if existing_task.completed_at is None:
            existing_task.completed_at = datetime.utcnow()
    else:
        existing_task.completed_at = None

    db.commit()
    db.refresh(existing_task)

    return existing_task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .filter(Task.id == task_id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}
