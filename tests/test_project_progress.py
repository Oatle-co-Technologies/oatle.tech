import pytest
from datetime import date, timedelta
from types import SimpleNamespace
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from backend.api.project_progress import router
from backend.api.daily_tasks import router as tasks_router
from backend.database.connection import get_db
from backend.dependencies import get_current_staff
from backend.models.client import Client
from backend.models.pricing import Product
from backend.models.project import Project
from backend.models.staff import Staff
from backend.models.campaign_day import CampaignDay
from backend.models.task import Task
from backend.models.project_progress import ProjectProgress, ProjectProgressEvent


@pytest.fixture
def progress_environment():
    engine = create_engine('sqlite://', connect_args={'check_same_thread':False}, poolclass=StaticPool)
    for model in (Client, Product, Project, Staff, CampaignDay, Task, ProjectProgress, ProjectProgressEvent):
        model.__table__.create(engine)
    with Session(engine) as db:
        db.add(Client(id=1,name='Example client',email='client@example.com'))
        db.add_all([Staff(id=1,name='Owner',email='owner@example.com',access_level='admin'),Staff(id=2,name='Assigned',email='assigned@example.com',access_level='member'),Staff(id=3,name='Other',email='other@example.com',access_level='member')])
        db.add_all([Project(id=1,name='Invitation',client_id=1,plan='Custom',status='active'),Project(id=2,name='Website',client_id=1,plan='Custom',status='active')])
        db.add_all([Task(id=1,name='Existing invitation work',assigned_to=1,status='in_progress'),Task(id=2,name='Assigned work',project_id=1,assigned_to=2,status='todo'),Task(id=3,name='Other project work',project_id=2,assigned_to=3,status='todo')])
        db.commit()
        identity={'id':1,'access_level':'admin'}
        app=FastAPI();app.include_router(router);app.include_router(tasks_router)
        app.dependency_overrides[get_db]=lambda: db
        app.dependency_overrides[get_current_staff]=lambda: SimpleNamespace(**identity)
        with TestClient(app) as client:
            yield client,db,identity
    engine.dispose()


def waiting_payload():
    return {'status':'waiting_for_client','phase':'client_input','current_update':'Design approved','waiting_for':'Child photo','expected_input':'Next week','next_action':'Replace photo and finish card','delivery_choice':'Shareable link','follow_up_date':str(date.today()-timedelta(days=1)),'linked_task_id':1}


def test_existing_task_is_linked_without_duplication_and_history_persists(progress_environment):
    client,db,_=progress_environment
    count=db.query(Task).count()
    response=client.put('/project-progress/1',json=waiting_payload())
    assert response.status_code == 200, response.text
    assert db.query(Task).count() == count
    assert db.get(Task,1).project_id == 1
    assert db.get(Task,1).status == 'in_progress'
    saved=client.get('/project-progress/1').json()
    assert saved['progress']['delivery_choice'] == 'Shareable link'
    assert saved['history'][0]['snapshot']['waiting_for'] == 'Child photo'
    assert saved['history'][0]['by'] == 'Owner'
    assert client.put('/project-progress/1',json=waiting_payload()).status_code == 200
    assert db.query(ProjectProgressEvent).count() == 1


def test_on_hold_is_project_state_and_can_be_resumed(progress_environment):
    client,db,_=progress_environment
    assert client.put('/project-progress/1',json={'status':'on_hold','hold_reason':'Waiting for budget','next_action':'Check in next month'}).status_code == 200
    assert db.get(Project,1).status == 'on_hold'
    assert db.get(Task,2).status == 'todo'
    assert client.get('/project-progress/summary').json()['on_hold'] == 1
    assert client.put('/project-progress/1',json={'status':'active','hold_reason':None,'next_action':'Start building'}).status_code == 200
    assert client.get('/project-progress/summary').json()['ready_to_continue'] == 1
    assert client.get('/project-progress/1').json()['history'][1]['snapshot']['hold_reason'] == 'Waiting for budget'


def test_summary_excludes_finished_followups(progress_environment):
    client,_,_=progress_environment
    client.put('/project-progress/1',json=waiting_payload())
    totals=client.get('/project-progress/summary').json()
    assert totals['waiting_on_clients'] == 1 and totals['followups_due'] == 1
    client.put('/project-progress/1',json={**waiting_payload(),'status':'completed'})
    totals=client.get('/project-progress/summary').json()
    assert totals['waiting_on_clients'] == 0 and totals['followups_due'] == 0


def test_unassigned_staff_cannot_change_progress_or_steal_task(progress_environment):
    client,db,identity=progress_environment
    identity.update(id=3,access_level='member')
    assert client.put('/project-progress/1',json=waiting_payload()).status_code == 403
    identity.update(id=2,access_level='member')
    assert client.put('/project-progress/1',json=waiting_payload()).status_code == 404
    assert db.get(Task,1).project_id is None
    assert [task['id'] for task in client.get('/project-progress/1').json()['tasks']] == [2]


def test_task_cannot_be_moved_from_another_project(progress_environment):
    client,db,_=progress_environment
    response=client.put('/project-progress/1',json={**waiting_payload(),'linked_task_id':3})
    assert response.status_code == 409
    assert db.get(Task,3).project_id == 2


def test_linked_task_status_is_live_without_recreating_task(progress_environment):
    client,db,identity=progress_environment
    identity.update(id=2,access_level='member')
    assert client.patch('/daily-tasks/2/progress',json={'status':'completed'}).status_code == 200
    assert client.get('/project-progress/1').json()['tasks'][0]['status'] == 'completed'
    assert db.query(Task).count() == 3


@pytest.mark.parametrize('payload',[{'status':'on_hold'},{'status':'waiting_for_client'},{'status':'made_up'}])
def test_missing_reasons_and_invalid_status_are_rejected(progress_environment,payload):
    client,db,_=progress_environment
    assert client.put('/project-progress/1',json=payload).status_code == 422
    assert db.get(Project,1).status == 'active'
