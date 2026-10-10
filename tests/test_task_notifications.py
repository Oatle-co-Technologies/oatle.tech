import base64
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import BackgroundTasks
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.models.task import Task
from backend.api.task_notifications import Subscription, summary, subscribe, unsubscribe, Unsubscribe
from backend.services.task_notifications import todo_count, notify_task_counts
from backend.api.tasks import update_task


def test_personal_count_excludes_other_staff_and_started_tasks():
    engine = create_engine("sqlite://")
    # Count query uses all mapped columns; related records are not needed here.
    Task.__table__.create(engine)
    with Session(engine) as db:
        db.add_all([Task(assigned_to=1, status=status, name="Test") for status in ["todo", "todo", "in_progress", "completed"]] + [Task(assigned_to=2, status="todo", name="Other"), Task(status="todo", name="Unassigned")])
        db.commit()
        assert todo_count(db, 1) == 2
        for role in ["admin", "member"]:
            assert summary(db, SimpleNamespace(id=1, access_level=role))["todo_count"] == 2
        task = db.query(Task).filter(Task.assigned_to == 1, Task.status == "todo").first()
        task.status = "in_progress"
        db.commit()
        assert todo_count(db, 1) == 1
        task.status = "completed"
        db.commit()
        assert todo_count(db, 1) == 1


def keys():
    return {"p256dh": base64.urlsafe_b64encode(b"\x04"+b"x"*64).decode(), "auth": base64.urlsafe_b64encode(b"x"*16).decode()}


@pytest.mark.parametrize("endpoint", ["http://fcm.googleapis.com/test", "https://127.0.0.1/test", "https://fcm.googleapis.com.evil.test/push", "https://user@fcm.googleapis.com/push", "https://web.push.apple.com:444/push"])
def test_subscription_rejects_untrusted_destinations(endpoint):
    with pytest.raises(ValidationError):
        Subscription(endpoint=endpoint, keys=keys())


def test_subscription_cannot_move_to_another_staff_account():
    db = MagicMock()
    db.execute.return_value.scalar.return_value = None
    with patch.dict("os.environ", {"VAPID_PRIVATE_KEY": "test", "VAPID_PUBLIC_KEY": "test"}):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as error:
            subscribe(Subscription(endpoint="https://fcm.googleapis.com/test", keys=keys()), BackgroundTasks(), db, SimpleNamespace(id=2))
        assert error.value.status_code == 409
        db.commit.assert_not_called()
    unsubscribe(Unsubscribe(endpoint="https://fcm.googleapis.com/test"), db, SimpleNamespace(id=2))
    assert db.execute.call_args.args[1]["staff"] == 2


def test_status_change_updates_both_assignees_after_save():
    db = MagicMock()
    task = SimpleNamespace(assigned_to=1, status="todo", completed_at=None)
    db.query.return_value.filter.return_value.first.return_value = task
    from backend.schemas.task import TaskCreate
    changed = TaskCreate(name="Test", assigned_to=2, status="in_progress")
    background = BackgroundTasks()
    with patch("backend.api.tasks.validate_assignee"), patch("backend.api.tasks.validate_task_type"):
        update_task(10, changed, background, db, SimpleNamespace(id=3, access_level="admin"))
    db.commit.assert_called_once()
    assert len(background.tasks) == 1
    assert background.tasks[0].args == ([1, 2],)
    unchanged = BackgroundTasks()
    with patch("backend.api.tasks.validate_assignee"), patch("backend.api.tasks.validate_task_type"):
        update_task(10, changed, unchanged, db, SimpleNamespace(id=3, access_level="admin"))
    assert unchanged.tasks == []


def test_push_contains_count_without_task_details_or_revenue():
    db = MagicMock()
    db.execute.return_value.mappings.return_value.all.return_value = [{"endpoint_hash": "hash", "endpoint": "https://fcm.googleapis.com/test", **keys()}]
    with patch.dict("os.environ", {"VAPID_PRIVATE_KEY": "test"}), patch("backend.services.task_notifications.SessionLocal") as factory, patch("backend.services.task_notifications.todo_count", return_value=3), patch("pywebpush.webpush") as send:
        factory.return_value.__enter__.return_value = db
        notify_task_counts([1, 1, None])
        import json
        assert json.loads(send.call_args.kwargs["data"]) == {"todo_count": 3, "staff_id": 1}
        assert send.call_count == 1


def test_enabling_alerts_initializes_existing_task_badge():
    db = MagicMock()
    db.execute.return_value.scalar.return_value = 1
    background = BackgroundTasks()
    with patch.dict("os.environ", {"VAPID_PRIVATE_KEY": "test", "VAPID_PUBLIC_KEY": "test"}):
        subscribe(Subscription(endpoint="https://fcm.googleapis.com/test", keys=keys()), background, db, SimpleNamespace(id=1))
    db.commit.assert_called_once()
    assert background.tasks[0].func is notify_task_counts
    assert background.tasks[0].args == ([1],)
