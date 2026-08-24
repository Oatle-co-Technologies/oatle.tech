from datetime import datetime, date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.client import Client
from backend.models.lead import Lead
from backend.models.project import Project
from backend.models.task import Task
from backend.models.invoice import Invoice

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
):
    today = date.today()

    now = datetime.utcnow()

    month_start = datetime(
        now.year,
        now.month,
        1,
    )

    if now.month == 12:
        next_month = datetime(
            now.year + 1,
            1,
            1,
        )
    else:
        next_month = datetime(
            now.year,
            now.month + 1,
            1,
        )

    # ---------------------------------------------------------
    # ACTIVE CLIENTS
    # ---------------------------------------------------------

    active_clients = (
        db.query(func.count(Client.id))
        .filter(Client.status == "active")
        .scalar()
        or 0
    )

    # ---------------------------------------------------------
    # REVENUE THIS MONTH
    # Only paid invoices whose paid_at falls in this month.
    # ---------------------------------------------------------

    revenue = (
        db.query(func.coalesce(func.sum(Invoice.amount), 0))
        .filter(
            Invoice.status == "paid",
            Invoice.paid_at >= month_start,
            Invoice.paid_at < next_month,
        )
        .scalar()
        or 0
    )

    # ---------------------------------------------------------
    # LEAD PIPELINE
    # ---------------------------------------------------------

    new_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.stage == "new")
        .scalar()
        or 0
    )

    contacted_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.stage == "contacted")
        .scalar()
        or 0
    )

    proposal_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.stage == "proposal")
        .scalar()
        or 0
    )

    won_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.stage == "won")
        .scalar()
        or 0
    )

    # Open leads are leads currently in the active sales pipeline.
    open_leads = (
        db.query(func.count(Lead.id))
        .filter(
            Lead.stage.in_(
                [
                    "new",
                    "contacted",
                    "proposal",
                ]
            )
        )
        .scalar()
        or 0
    )

    # ---------------------------------------------------------
    # PROJECTS
    #
    # planning, active and on_hold are considered active work.
    # completed and cancelled are excluded.
    # ---------------------------------------------------------

    active_project_count = (
        db.query(func.count(Project.id))
        .filter(
            Project.status.in_(
                [
                    "planning",
                    "active",
                    "on_hold",
                ]
            )
        )
        .scalar()
        or 0
    )

    active_projects = (
        db.query(Project)
        .filter(
            Project.status.in_(
                [
                    "planning",
                    "active",
                    "on_hold",
                ]
            )
        )
        .order_by(Project.created_at.desc())
        .limit(5)
        .all()
    )

    projects_data = [
        {
            "id": project.id,
            "name": project.name,
            "status": project.status,
            "target_date": (
                project.target_date.isoformat()
                if project.target_date
                else None
            ),
        }
        for project in active_projects
    ]

    # ---------------------------------------------------------
    # TODAY'S TASKS
    # ---------------------------------------------------------

    today_tasks = (
        db.query(Task)
        .filter(
            Task.due_date == today,
            Task.status != "completed",
        )
        .order_by(
            Task.priority.desc(),
            Task.created_at.asc(),
        )
        .limit(5)
        .all()
    )

    tasks_data = [
        {
            "id": task.id,
            "name": task.name,
            "status": task.status,
            "priority": task.priority,
            "due_date": (
                task.due_date.isoformat()
                if task.due_date
                else None
            ),
            "assigned_to": task.assigned_to,
        }
        for task in today_tasks
    ]

    # ---------------------------------------------------------
    # RECENT ACTIVITY
    #
    # For now this is based on recently created tasks.
    # We are not inventing an activity table that doesn't exist.
    # ---------------------------------------------------------

    recent_tasks = (
        db.query(Task)
        .order_by(Task.created_at.desc())
        .limit(5)
        .all()
    )

    recent_activity = [
        {
            "id": task.id,
            "type": "task",
            "name": task.name,
            "status": task.status,
            "created_at": (
                task.created_at.isoformat()
                if task.created_at
                else None
            ),
        }
        for task in recent_tasks
    ]

    return {
        "revenue": float(revenue),
        "active_clients": active_clients,
        "open_leads": open_leads,
        "projects_in_progress": active_project_count,
        "lead_pipeline": {
            "new": new_leads,
            "contacted": contacted_leads,
            "proposal": proposal_leads,
            "won": won_leads,
        },
        "projects": projects_data,
        "tasks_due_today": tasks_data,
        "recent_activity": recent_activity,
    }