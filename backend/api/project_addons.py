from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from backend.database.connection import get_db

from backend.models.project import Project

from backend.models.pricing import AddOn

from backend.models.project_addon import ProjectAddOn


router = APIRouter(
    prefix="/projects",
    tags=["Project Add-ons"],
)


@router.get("/{project_id}/addons")
def get_project_addons(
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

    addons = (
        db.query(AddOn)
        .join(
            ProjectAddOn,
            ProjectAddOn.addon_id == AddOn.id,
        )
        .filter(ProjectAddOn.project_id == project_id)
        .all()
    )

    return addons


@router.post("/{project_id}/addons/{addon_id}")
def add_addon_to_project(
    project_id: int,
    addon_id: int,
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

    addon = (
        db.query(AddOn)
        .filter(AddOn.id == addon_id)
        .first()
    )

    if not addon:
        raise HTTPException(
            status_code=404,
            detail="Add-on not found",
        )

    existing = (
        db.query(ProjectAddOn)
        .filter(
            ProjectAddOn.project_id == project_id,
            ProjectAddOn.addon_id == addon_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Add-on already added to this project",
        )

    project_addon = ProjectAddOn(
        project_id=project_id,
        addon_id=addon_id,
        price_at_selection=addon.price,
    )

    db.add(project_addon)
    db.commit()

    return {
        "message": "Add-on added to project successfully",
        "project_id": project_id,
        "addon_id": addon_id,
    }


@router.delete("/{project_id}/addons/{addon_id}")
def remove_addon_from_project(
    project_id: int,
    addon_id: int,
    db: Session = Depends(get_db),
):

    project_addon = (
        db.query(ProjectAddOn)
        .filter(
            ProjectAddOn.project_id == project_id,
            ProjectAddOn.addon_id == addon_id,
        )
        .first()
    )

    if not project_addon:
        raise HTTPException(
            status_code=404,
            detail="Add-on is not attached to this project",
        )

    db.delete(project_addon)
    db.commit()

    return {
        "message": "Add-on removed from project successfully",
        "project_id": project_id,
        "addon_id": addon_id,
    }