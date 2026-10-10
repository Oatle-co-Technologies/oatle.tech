from datetime import date
from types import SimpleNamespace
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
import pytest
from backend.database.base import Base
from backend.database.connection import get_db
from backend.dependencies import get_current_staff
from backend.models.staff import Staff
from backend.models.task import Task
from backend.models.campaign_day import CampaignDay
from backend.api.daily_tasks import router
from backend.services.campaign_setup import seed_campaign


@pytest.fixture
def environment():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    # Only these tables are used; SQLite handles the existing UUID staff column.
    for table in (Staff.__table__, CampaignDay.__table__, Task.__table__):
        table.create(engine)
    db = Session(engine)
    db.add_all([Staff(id=1, name="Founder", email="founder@example.com", access_level="admin"),
                Staff(id=2, name="Kat", email="kat@example.com", access_level="member"),
                Staff(id=3, name="Colin", email="colin@example.com", access_level="member"),
                Staff(id=4, name="Inactive", email="inactive@example.com", active=False)])
    db.commit()
    identity = {"id": 1, "access_level": "admin"}
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_staff] = lambda: SimpleNamespace(**identity)
    with TestClient(app) as client:
        yield client, db, identity
    db.close()
    engine.dispose()


def create(client, person=1, **extra):
    return client.post("/daily-tasks", json={"name": "Assignment", "assigned_to": person, "due_date": "2026-10-01", **extra})


def test_assign_founder_and_team_and_personal_visibility(environment):
    client, db, identity = environment
    ids = [create(client, person).json()["id"] for person in (1, 2, 3)]
    assert len(client.get("/daily-tasks").json()) == 1
    assert len(client.get("/daily-tasks?mine=false").json()) == 3
    for person in (2, 3):
        identity.update(id=person, access_level="member")
        records = client.get("/daily-tasks?mine=false").json()
        assert len(records) == 1 and records[0]["assigned_to"] == person
        # Overdue tasks remain accessible and returned without a date restriction.
        assert records[0]["due_date"] == "2026-10-01"
        assert client.patch(f"/daily-tasks/{ids[0]}/progress", json={"status": "completed"}).status_code == 404


def test_progress_persists_completes_and_reopens(environment):
    client, db, identity = environment
    record = create(client, 2).json()
    identity.update(id=2, access_level="member")
    path = f"/daily-tasks/{record['id']}/progress"
    assert client.patch(path, json={"status": "in_progress", "notes": "Screenshots ready"}).status_code == 200
    done = client.patch(path, json={"status": "completed"}).json()
    assert done["completed_at"] and done["notes"] == "Screenshots ready"
    assert client.patch(path, json={"notes": "Delivered"}).json()["completed_at"] == done["completed_at"]
    db.expire_all()
    assert client.get("/daily-tasks").json()[0]["notes"] == "Delivered"
    reopened = client.patch(path, json={"status": "blocked"}).json()
    assert reopened["completed_at"] is None
    assert client.patch(path, json={"status": "todo"}).json()["status"] == "todo"
    assert client.patch(path, json={"assigned_to": 3}).status_code == 422
    assert client.patch(path, json={"name": "Changed"}).status_code == 422
    assert client.patch(path, json={"status": "unknown"}).status_code == 422
    assert client.patch(path, json={"status": None}).status_code == 422


def test_staff_management_denied(environment):
    client, db, identity = environment
    task_id = create(client, 2).json()["id"]
    identity.update(id=2, access_level="member")
    for method, path, payload in [
        ("POST", "/daily-tasks", {"name": "Forbidden", "assigned_to": 2}),
        ("PUT", f"/daily-tasks/{task_id}", {"name": "Changed", "assigned_to": 3}),
        ("DELETE", f"/daily-tasks/{task_id}", None),
        ("POST", f"/daily-tasks/{task_id}/duplicate", None),
        ("POST", "/daily-tasks/campaigns/schedule", {"focus_date": "2026-10-13", "industry": "Beauty", "campaign_name": "Campaign"}),
        ("PUT", "/daily-tasks/campaigns/schedule/1", {"focus_date": "2026-10-13", "industry": "Beauty", "campaign_name": "Campaign"}),
        ("POST", "/daily-tasks/campaigns/initial-setup", {"founder_id": 1, "kat_id": 2, "colin_id": 3}),
    ]:
        assert client.request(method, path, json=payload).status_code == 403
    assert client.get("/daily-tasks/campaigns/schedule").status_code == 200


def test_admin_campaign_edit_assignment_duplicate_delete(environment):
    client, db, identity = environment
    day = client.post("/daily-tasks/campaigns/schedule", json={"focus_date": "2026-10-13", "industry": "Mobile Beauty Studio", "campaign_name": "Launch", "description": "Flyers"}).json()
    record = create(client, 1, campaign_day_id=day["id"]).json()
    updated = client.put(f"/daily-tasks/{record['id']}", json={"name": "Flyer", "description": "Both screenshots", "assigned_to": 2, "campaign_day_id": day["id"], "due_date": "2026-10-12", "status": "completed", "notes": "Delivered"}).json()
    assert updated["assigned_to"] == 2 and updated["completed_at"]
    copy = client.post(f"/daily-tasks/{record['id']}/duplicate").json()
    assert copy["status"] == "todo" and copy["completed_at"] is None and copy["notes"] is None
    assert copy["campaign_day_id"] == day["id"]
    assert client.put(f"/daily-tasks/campaigns/schedule/{day['id']}", json={"focus_date": "2026-10-17", "industry": "Plumbing Services", "campaign_name": "Launch"}).status_code == 200
    assert client.delete(f"/daily-tasks/{record['id']}").status_code == 200
    assert create(client, 4).status_code == 400
    assert create(client, 99).status_code == 404
    assert create(client, 1, campaign_day_id=999).status_code == 404
    assert create(client, 1, name=" ").status_code == 422


def test_campaign_date_unique_and_setup_idempotent(environment):
    client, db, identity = environment
    counts = seed_campaign(db, 1, 2, 3, 1)
    db.commit()
    assert counts == {"campaign_days_created": 10, "tasks_created": 32}
    days = db.query(CampaignDay).order_by(CampaignDay.focus_date).all()
    assert all(day.focus_date.weekday() < 5 for day in days)
    assert [day.industry for day in days[1:5]] == ["Mobile Beauty Studio", "Cleaning Services", "Daycare Services", "Event Planning & Décor Services"]
    founder_flyers = db.query(Task).filter(Task.assigned_to == 1, Task.setup_key.like("%-flyer")).all()
    assert len(founder_flyers) == 4
    screenshots = db.query(Task).filter(Task.assigned_to == 3, Task.setup_key.like("%-screenshots")).all()
    assert len(screenshots) == 4
    founder_flyers[0].status = "completed"
    days[1].industry = "Founder edited focus"
    db.commit()
    assert seed_campaign(db, 1, 2, 3, 1) == {"campaign_days_created": 0, "tasks_created": 0}
    assert founder_flyers[0].status == "completed" and days[1].industry == "Founder edited focus"
    duplicate = client.post("/daily-tasks/campaigns/schedule", json={"focus_date": "2026-10-13", "industry": "Duplicate", "campaign_name": "Launch"})
    assert duplicate.status_code == 409
    assert client.get("/daily-tasks/campaigns/schedule").status_code == 200
