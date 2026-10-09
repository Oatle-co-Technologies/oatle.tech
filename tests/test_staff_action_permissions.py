from types import SimpleNamespace
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.dependencies import get_current_staff
from backend.database.connection import get_db
from backend.api.tasks import router as tasks_router
from backend.api.appointments import router as appointments_router
from backend.api.google_calendar import router as calendar_router


def client_for(role='member', owner=False):
    app = FastAPI()
    for router in (tasks_router, appointments_router, calendar_router): app.include_router(router)
    staff = SimpleNamespace(id=2, access_level=role, active=True)
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    app.dependency_overrides[get_current_staff] = lambda: staff
    app.dependency_overrides[get_db] = lambda: db
    @app.middleware('http')
    async def identity(request, call_next):
        request.state.financial_owner = owner
        return await call_next(request)
    return TestClient(app), db


def test_staff_cannot_create_or_delete_tasks_or_manage_calendar():
    client, db = client_for()
    appointment = {'participant_name':'Test', 'participant_email':'test@example.com', 'title':'Test',
                   'start_time':'2026-10-12T10:00:00+02:00', 'end_time':'2026-10-12T11:00:00+02:00'}
    for method, path, payload in [
        ('POST','/tasks',{'name':'Test','assigned_to':2}), ('DELETE','/tasks/1',None),
        ('POST','/appointments',appointment), ('PUT','/appointments/1',{'title':'Changed'}),
        ('DELETE','/appointments/1',None), ('POST','/google-calendar/events', {'summary':'Test', 'start_time':appointment['start_time'], 'end_time':appointment['end_time']})]:
        assert client.request(method,path,json=payload).status_code == 403
    db.query.assert_not_called()
    db.commit.assert_not_called()


def test_another_admin_cannot_use_owner_only_actions():
    client, db = client_for('admin', False)
    assert client.delete('/tasks/1').status_code == 403
    assert client.delete('/appointments/1').status_code == 403
    db.query.assert_not_called()


def test_owner_can_reach_management_actions():
    client, db = client_for('admin', True)
    # Missing record returns 404, demonstrating the owner passes authorization.
    assert client.delete('/tasks/1').status_code == 404
    assert client.delete('/appointments/1').status_code == 404
    assert db.query.call_count == 2


def test_staff_can_still_read_appointments():
    client, db = client_for()
    db.query.return_value.order_by.return_value.all.return_value = []
    with patch('backend.api.appointments.list_calendar_events', return_value=[]):
        assert client.get('/appointments').status_code == 200


def test_staff_can_edit_own_task_but_not_another_staff_task():
    client, db = client_for()
    task = SimpleNamespace(id=1, assigned_to=2, name='Test', task_type='service', service_id=1,
                           status='todo', priority='medium', description=None, category=None,
                           project_id=None, product_service_id=None, due_date=None, notes=None,
                           created_at=None, completed_at=None, assigned_staff=None)
    db.query.return_value.filter.return_value.first.return_value = task
    payload={'name':'Test','task_type':'service','service_id':1,'assigned_to':2,'status':'in_progress'}
    with patch('backend.api.tasks.validate_assignee'), patch('backend.api.tasks.validate_task_type'), patch('backend.api.tasks.notify_task_counts'):
        assert client.put('/tasks/1',json=payload).status_code == 200
        assert task.status == 'in_progress'
        task.assigned_to=3
        assert client.put('/tasks/1',json=payload).status_code == 404
