from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.project import Project
from backend.models.client import Client
from backend.models.pricing import Product
from backend.schemas.project import ProjectCreate


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    # Check that the client exists
    client = (
        db.query(Client)
        .filter(Client.id == project.client_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found",
        )

    # Check that the selected product exists
    product = (
        db.query(Product)
        .filter(
            Product.id == project.product_id,
            Product.active == True,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    new_project = Project(
        client_id=project.client_id,
        product_id=project.product_id,
        name=project.name,
        website=project.website,
        plan=project.plan,
        description=project.description,
        status=project.status,
        target_date=project.target_date,
        notes=project.notes,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get("/")
def get_projects(
    db: Session = Depends(get_db),
):
    projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .all()
    )

    return projects


@router.get("/{project_id}")
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


@router.put("/{project_id}")
def update_project(
    project_id: int,
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    existing_project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not existing_project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    # Check that the client exists
    client = (
        db.query(Client)
        .filter(Client.id == project.client_id)
        .first()
    )

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found",
        )

    # Check that the selected product exists
    product = (
        db.query(Product)
        .filter(
            Product.id == project.product_id,
            Product.active == True,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    existing_project.client_id = project.client_id
    existing_project.product_id = project.product_id
    existing_project.name = project.name
    existing_project.website = project.website
    existing_project.plan = project.plan
    existing_project.description = project.description
    existing_project.status = project.status
    existing_project.target_date = project.target_date
    existing_project.notes = project.notes

    db.commit()
    db.refresh(existing_project)

    return existing_project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }