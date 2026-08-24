from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.project import Project
from backend.models.product_service import ProductService
from backend.models.pricing import Service
from backend.models.task import Task
from backend.schemas.task import TaskCreate, TaskResponse


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


@router.post(
    "/",
    response_model=TaskResponse,
)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
):

    if task.task_type == "product":

        if task.product_service_id is None:
            raise HTTPException(
                status_code=400,
                detail="A product service is required for a product task",
            )

        product_service = (
            db.query(ProductService)
            .filter(
                ProductService.id == task.product_service_id
            )
            .first()
        )

        if not product_service:
            raise HTTPException(
                status_code=404,
                detail="Product service not found",
            )

    elif task.task_type == "service":

        if task.service_id is None:
            raise HTTPException(
                status_code=400,
                detail="A service is required for a service task",
            )

        service = (
            db.query(Service)
            .filter(
                Service.id == task.service_id
            )
            .first()
        )

        if not service:
            raise HTTPException(
                status_code=404,
                detail="Service not found",
            )

    else:

        raise HTTPException(
            status_code=400,
            detail="Task type must be 'product' or 'service'",
        )

    new_task = Task(
        project_id=task.project_id,
        product_service_id=task.product_service_id,
        service_id=task.service_id,
        assigned_to=task.assigned_to,
        task_type=task.task_type,
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


@router.get(
    "/",
    response_model=list[TaskResponse],
)
def get_tasks(
    db: Session = Depends(get_db),
):

    return (
        db.query(Task)
        .order_by(Task.created_at.desc())
        .all()
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
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


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
)
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

    if task.task_type == "product":

        if task.product_service_id is None:
            raise HTTPException(
                status_code=400,
                detail="A product service is required for a product task",
            )

        product_service = (
            db.query(ProductService)
            .filter(
                ProductService.id == task.product_service_id
            )
            .first()
        )

        if not product_service:
            raise HTTPException(
                status_code=404,
                detail="Product service not found",
            )

    elif task.task_type == "service":

        if task.service_id is None:
            raise HTTPException(
                status_code=400,
                detail="A service is required for a service task",
            )

        service = (
            db.query(Service)
            .filter(
                Service.id == task.service_id
            )
            .first()
        )

        if not service:
            raise HTTPException(
                status_code=404,
                detail="Service not found",
            )

    else:

        raise HTTPException(
            status_code=400,
            detail="Task type must be 'product' or 'service'",
        )

    existing_task.project_id = task.project_id
    existing_task.product_service_id = task.product_service_id
    existing_task.service_id = task.service_id
    existing_task.assigned_to = task.assigned_to
    existing_task.task_type = task.task_type
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

    return {
        "message": "Task deleted successfully"
    }