from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.dependencies import get_current_staff
from backend.models.product_service import ProductService
from backend.models.pricing import Service
from backend.models.staff import Staff
from backend.models.task import Task
from backend.schemas.task import TaskCreate, TaskResponse
from backend.services.email_service import (
    send_task_assignment_email,
)


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
    dependencies=[Depends(get_current_staff)],
)


# ============================================================
# VALIDATE ASSIGNEE
# ============================================================

def validate_assignee(
    assigned_to: int | None,
    db: Session,
):
    if assigned_to is None:
        return

    staff_member = (
        db.query(Staff)
        .filter(Staff.id == assigned_to)
        .first()
    )

    if not staff_member:
        raise HTTPException(
            status_code=404,
            detail="Assigned staff member not found",
        )

    if not staff_member.active:
        raise HTTPException(
            status_code=400,
            detail="Assigned staff member is inactive",
        )


# ============================================================
# VALIDATE TASK TYPE
# ============================================================

def validate_task_type(
    task: TaskCreate,
    db: Session,
):
    if task.task_type == "product":

        if task.product_service_id is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "A product service is required "
                    "for a product task"
                ),
            )

        product_service = (
            db.query(ProductService)
            .filter(
                ProductService.id
                == task.product_service_id
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
                detail=(
                    "A service is required "
                    "for a service task"
                ),
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
            detail=(
                "Task type must be 'product' "
                "or 'service'"
            ),
        )


# ============================================================
# CREATE TASK
# ============================================================

@router.post(
    "",
    response_model=TaskResponse,
)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
):
    validate_assignee(
        task.assigned_to,
        db,
    )

    validate_task_type(
        task,
        db,
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

    # ========================================================
    # SEND TASK ASSIGNMENT EMAIL
    # ========================================================

    if new_task.assigned_to is not None:

        staff_member = (
            db.query(Staff)
            .filter(
                Staff.id
                == new_task.assigned_to
            )
            .first()
        )

        if staff_member:

            send_task_assignment_email(
                recipient_email=staff_member.email,
                recipient_name=staff_member.name,
                task_name=new_task.name,
                task_description=new_task.description,
                due_date=new_task.due_date,
                priority=new_task.priority,
            )

    return new_task


# ============================================================
# GET ALL TASKS
# ============================================================

@router.get(
    "",
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


# ============================================================
# GET SINGLE TASK
# ============================================================

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


# ============================================================
# UPDATE TASK
# ============================================================

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

    validate_assignee(
        task.assigned_to,
        db,
    )

    validate_task_type(
        task,
        db,
    )

    existing_task.project_id = task.project_id

    existing_task.product_service_id = (
        task.product_service_id
    )

    existing_task.service_id = (
        task.service_id
    )

    existing_task.assigned_to = (
        task.assigned_to
    )

    existing_task.task_type = (
        task.task_type
    )

    existing_task.name = task.name

    existing_task.description = (
        task.description
    )

    existing_task.category = (
        task.category
    )

    existing_task.status = task.status

    existing_task.priority = (
        task.priority
    )

    existing_task.due_date = (
        task.due_date
    )

    existing_task.notes = task.notes

    if task.status == "completed":

        if existing_task.completed_at is None:
            existing_task.completed_at = (
                datetime.utcnow()
            )

    else:
        existing_task.completed_at = None

    db.commit()
    db.refresh(existing_task)

    return existing_task


# ============================================================
# DELETE TASK
# ============================================================

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