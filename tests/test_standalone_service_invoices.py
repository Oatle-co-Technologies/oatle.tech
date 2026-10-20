"""Invoice catalogue integration checks against an isolated in-memory database."""
from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from backend.database.base import Base
from backend.database.connection import get_db
from backend.dependencies import get_admin_staff
from backend.models.client import Client
from backend.models.project import Project
from backend.models.project_addon import ProjectAddOn  # register the relationship
from backend.models.pricing import Product, AddOn, Service
from backend.models.invoice import Invoice
from backend.api.invoices import router as invoice_router
from backend.api.pricing import router as pricing_router
from backend.api.project_addons import router as project_addons_router
from backend.database.seed_pricing import sync_catalogue


@pytest.fixture
def system():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as db:
        client = Client(name="Catalogue test client", email="catalogue-test@example.invalid")
        db.add(client)
        sync_catalogue(db)
        db.commit()
        app = FastAPI()
        app.include_router(invoice_router)
        app.include_router(pricing_router)
        app.include_router(project_addons_router)
        app.dependency_overrides[get_db] = lambda: db
        app.dependency_overrides[get_admin_staff] = lambda: SimpleNamespace(id=1, access_level="admin")
        yield TestClient(app), db, client
    engine.dispose()


def payload(client, **extra):
    return dict(client_id=client.id, issue_date=str(date.today()), status="draft", **extra)


def test_pdf_service_catalogue_is_priced_and_repeatable(system):
    api, db, _ = system
    items = api.get('/pricing/services').json()
    assert len(items) == 25
    prices = {item['name']: item['base_price'] for item in items}
    assert prices['Custom Static Invitation'] == 300
    assert prices['Animated Digital Invitation'] == 350
    assert prices['Website Audit & Consultation'] == 750
    assert prices['Google Business Profile Setup'] == 500
    assert next(x for x in items if x['name'] == 'Ongoing SEO')['billing_period'] == 'month'
    ids = {item['name']: item['id'] for item in items}
    sync_catalogue(db)
    db.commit()
    assert {item['name']: item['id'] for item in api.get('/pricing/services').json()} == ids


def test_all_pdf_services_can_be_invoiced_without_a_project(system):
    api, _, client = system
    for service in api.get('/pricing/services').json():
        response = api.post('/invoices', json=payload(client, service_id=service['id']))
        assert response.status_code == 200, response.text
        body = response.json()
        assert body['project_id'] is None
        assert body['service_id'] == service['id']
        assert body['service_name'] == service['name']
        assert body['amount'] == service['base_price']


def test_service_discount_payments_and_historical_total(system):
    api, db, client = system
    service = db.query(Service).filter_by(name='Custom Static Invitation').one()
    response = api.post('/invoices', json=payload(client, service_id=service.id, discount_percent=10, payment_amount=100))
    invoice = response.json()
    assert invoice['amount'] == 270 and invoice['total_paid'] == 100 and invoice['balance_due'] == 170
    service.base_price = 600
    service.active = False
    db.commit()
    response = api.put(f"/invoices/{invoice['id']}", json={**payload(client, service_id=service.id, discount_percent=10, payment_amount=170), 'status': 'paid'})
    assert response.status_code == 200, response.text
    assert response.json()['amount'] == 270
    assert response.json()['total_paid'] == 270
    assert response.json()['status'] == 'paid'
    assert len(response.json()['payments']) == 2


def test_existing_project_addons_and_from_prices(system):
    api, db, client = system
    product = db.query(Product).filter_by(name='Marketing Page').one()
    project = Project(client_id=client.id, product_id=product.id, name='Existing development project', plan=product.name)
    db.add(project); db.flush()
    addon = db.query(AddOn).filter_by(name='Google Business Profile Setup').one()
    db.add(ProjectAddOn(project_id=project.id, addon_id=addon.id, price_at_selection=addon.price)); db.commit()
    result = api.post('/invoices', json=payload(client, project_id=project.id)).json()
    assert result['amount'] == 3500
    agreed = api.post('/invoices', json=payload(client, project_id=project.id, quoted_amount=4000)).json()
    assert agreed['amount'] == 4500
    assert api.post('/invoices', json=payload(client, project_id=project.id, quoted_amount=2500)).status_code == 400
    addon.price = 1000; product.base_price = 5000; db.commit()
    edited = api.put(f"/invoices/{result['id']}", json=payload(client, project_id=project.id)).json()
    assert edited['amount'] == 3500
    new_invoice = api.post('/invoices', json=payload(client, project_id=project.id)).json()
    assert new_invoice['amount'] == 5500  # selected add-on remains R500, not its new R1,000 catalogue price
    assert api.get(f'/projects/{project.id}/addons').json()[0]['price'] == 500


def test_quoted_services_and_invalid_invoice_targets(system):
    api, db, client = system
    quote = Service(name='Legacy consultation', pricing_type='quoted', active=True)
    db.add(quote); db.commit()
    assert api.post('/invoices', json=payload(client, service_id=quote.id)).status_code == 400
    response = api.post('/invoices', json=payload(client, service_id=quote.id, quoted_amount=900))
    assert response.json()['amount'] == 900
    assert api.post('/invoices', json=payload(client)).status_code == 400
    assert api.post('/invoices', json=payload(client, service_id=quote.id, project_id=1)).status_code == 400
    assert api.post('/invoices', json=payload(client, service_id=999999)).status_code == 404
    assert api.post('/invoices', json=payload(client, service_id=quote.id, quoted_amount=-1)).status_code == 400
    assert api.post('/invoices', json=payload(client, service_id=quote.id, quoted_amount=900, discount_percent=101)).status_code == 400
    assert api.post('/invoices', json=payload(client, service_id=quote.id, quoted_amount=900, payment_amount=901)).status_code == 400


def test_seed_keeps_legacy_service_ids_and_inactive_flags(system):
    _, db, _ = system
    seo = db.query(Service).filter_by(name='SEO Optimisation').one()
    seo.name = 'SEO Optimization'; seo.active = False
    service_id = seo.id
    db.commit()
    sync_catalogue(db); db.commit()
    seo = db.get(Service, service_id)
    assert seo.name == 'SEO Optimisation' and seo.base_price == 1500
    assert not seo.active


def test_invoice_endpoints_still_require_admin(system):
    api, _, client = system
    api.app.dependency_overrides.clear()
    assert api.post('/invoices', json=payload(client, service_id=1)).status_code in (401, 403)
    assert api.post('/pricing/services', json={'name': 'Unapproved service', 'base_price': 1}).status_code in (401, 403)
