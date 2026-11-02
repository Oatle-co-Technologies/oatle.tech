"""Invoice catalogue integration checks against an isolated in-memory database."""
from datetime import date, timedelta
from contextlib import nullcontext
from email.message import EmailMessage
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException
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
from backend.services import invoice_email
from backend.services import mailbox_service
from backend.api.pricing import router as pricing_router
from backend.api.project_addons import router as project_addons_router
from backend.database.seed_pricing import sync_catalogue


@pytest.fixture
def system(monkeypatch):
    monkeypatch.setenv("INVOICE_BANK_NAME", "Test Bank")
    monkeypatch.setenv("INVOICE_BANK_ACCOUNT_HOLDER", "Test Account Holder")
    monkeypatch.setenv("INVOICE_BANK_ACCOUNT_NUMBER", "TEST-ACCOUNT")
    monkeypatch.setenv("INVOICE_BANK_ACCOUNT_TYPE", "Test Account Type")
    monkeypatch.setenv("INVOICE_BANK_BRANCH_CODE", "TEST-BRANCH")
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
    assert api.post('/invoices/1/send', json={"resend": False}).status_code in (401, 403)
    assert api.post('/pricing/services', json={'name': 'Unapproved service', 'base_price': 1}).status_code in (401, 403)


def test_invoice_email_preserves_template_data_and_escapes_dynamic_html():
    client = Client(name="<Client>", email="client@example.com")
    invoice = Invoice(
        invoice_number="INV-123",
        amount=900,
        legacy_amount_paid=100,
        discount_percent=10,
        issue_date=date(2026, 11, 2),
        due_date=date(2026, 11, 30),
        notes="<script>unsafe</script>",
    )
    product = Service(name="Consultation", base_price=1000, pricing_type="fixed")
    values = invoice_email.invoice_template_values(invoice, client, None, product, [])
    values.update({
        "bank_name": "Test Bank",
        "account_holder": "Test Account Holder",
        "account_number": "TEST-ACCOUNT",
        "account_type": "Test Account Type",
        "branch_code": "TEST-BRANCH",
    })
    rendered = invoice_email.render_invoice_html(values)

    assert values["amount"] == "800.00"
    assert values["subtotal"] == "1000.00"
    assert values["discount_amount"] == "100.00"
    assert "INV-123" in rendered
    assert "R800.00" in rendered
    assert "&lt;script&gt;unsafe&lt;/script&gt;" in rendered
    assert "<script>unsafe</script>" not in rendered
    assert "{{" not in rendered and "}}" not in rendered
    assert "Test Bank" in rendered
    assert "TEST-ACCOUNT" in rendered
    assert "info@oatle-technologies.co.za" in rendered
    assert "oatle.technologies@gmail.com" not in rendered

    fixed_discount_invoice = Invoice(
        invoice_number="INV-124",
        amount=950,
        discount_percent=0,
        discount_fixed=50,
        issue_date=date(2026, 11, 2),
    )
    fixed_values = invoice_email.invoice_template_values(
        fixed_discount_invoice, client, None, product, []
    )
    assert fixed_values["subtotal"] == "1000.00"
    assert fixed_values["discount_percent"] == "5.00"
    assert fixed_values["discount_amount"] == "50.00"


def test_invoice_banking_details_must_be_configured(monkeypatch):
    for environment_key in invoice_email.BANKING_ENVIRONMENT_KEYS.values():
        monkeypatch.delenv(environment_key, raising=False)

    with pytest.raises(HTTPException, match="Invoice banking details are not configured"):
        invoice_email.invoice_banking_details()


def test_invoice_email_uses_saved_project_addon_price_and_balance(system):
    api, db, client = system
    product = db.query(Product).filter_by(name="Marketing Page").one()
    project = Project(
        client_id=client.id,
        product_id=product.id,
        name="Invoice test project",
        plan=product.name,
        notes="Project notes",
    )
    addon = db.query(AddOn).filter_by(name="Google Business Profile Setup").one()
    db.add(project)
    db.flush()
    db.add(ProjectAddOn(project_id=project.id, addon_id=addon.id, price_at_selection=450))
    db.commit()

    invoice = api.post(
        "/invoices",
        json=payload(client, project_id=project.id, discount_percent=10, payment_amount=105),
    ).json()
    recipient, values = invoice_email.build_invoice_email(db.get(Invoice, invoice["id"]), db)

    assert recipient == client.email
    assert values["product_price"] == "3000.00"
    assert values["addons"] == "Google Business Profile Setup — R450.00"
    assert values["subtotal"] == "3450.00"
    assert values["discount_amount"] == "345.00"
    assert values["amount"] == "3000.00"
    assert values["notes"] == "Project notes"
    assert values["bank_name"] == "Test Bank"
    assert values["account_number"] == "TEST-ACCOUNT"


def test_invoice_email_delivery_uses_business_sender_and_server_secret(monkeypatch):
    sent = []
    monkeypatch.setenv("PURELYMAIL_INFO_PASSWORD", "server-only-test-secret")
    monkeypatch.setattr(invoice_email, "deliver_via_purelymail", lambda box, message, recipient: sent.append((box, message, recipient)))
    invoice_email.send_invoice_email("client@example.com", {
        "invoice_number": "INV-123",
        "client_name": "Test Client",
        "client_email": "client@example.com",
        "project_name": "Website",
        "notes": "Description",
        "issue_date": "2026-11-02",
        "due_date": "2026-11-30",
        "product_name": "Website",
        "product_price": "1000.00",
        "addons": "No add-ons",
        "subtotal": "1000.00",
        "discount_percent": "0.00",
        "discount_amount": "0.00",
        "amount": "1000.00",
        "bank_name": "Test Bank",
        "account_holder": "Test Account Holder",
        "account_number": "TEST-ACCOUNT",
        "account_type": "Test Account Type",
        "branch_code": "TEST-BRANCH",
    })

    box, message, recipient = sent[0]
    assert box == {
        "address": "info@oatle-technologies.co.za",
        "password": "server-only-test-secret",
    }
    assert str(message["From"]) == "Oatle Technologies <info@oatle-technologies.co.za>"
    assert message["Reply-To"] == "info@oatle-technologies.co.za"
    assert recipient == "client@example.com"
    assert message.get_body(preferencelist=("html",)).get_content().startswith("<div")
    assert "INV-123" in message.get_body(preferencelist=("plain",)).get_content()
    assert "Test Account Holder" in message.get_body(preferencelist=("plain",)).get_content()
    assert "TEST-ACCOUNT" in message.get_body(preferencelist=("html",)).get_content()

    monkeypatch.delenv("PURELYMAIL_INFO_PASSWORD")
    with pytest.raises(HTTPException, match="Invoice email sending is not configured"):
        invoice_email.send_invoice_email("client@example.com", {
            "invoice_number": "INV-123",
            "client_name": "Test Client",
            "client_email": "client@example.com",
            "project_name": "Website",
            "notes": "Description",
            "issue_date": "2026-11-02",
            "due_date": "2026-11-30",
            "product_name": "Website",
            "product_price": "1000.00",
            "addons": "No add-ons",
            "subtotal": "1000.00",
            "discount_percent": "0.00",
            "discount_amount": "0.00",
            "amount": "1000.00",
            "bank_name": "Test Bank",
            "account_holder": "Test Account Holder",
            "account_number": "TEST-ACCOUNT",
            "account_type": "Test Account Type",
            "branch_code": "TEST-BRANCH",
        })
        assert len(sent) == 1


def test_invoice_send_status_changes_only_after_delivery_and_blocks_duplicate(system):
    api, db, client = system
    service = db.query(Service).filter_by(name="Custom Static Invitation").one()
    invoice = api.post("/invoices", json=payload(client, service_id=service.id)).json()

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr("backend.api.invoices.send_invoice_email", lambda recipient, values: False)
        response = api.post(f"/invoices/{invoice['id']}/send", json={"resend": False})

    assert response.status_code == 200, response.text
    assert response.json()["sent_copy_saved"] is False
    assert response.json()["status"] == "sent"
    assert response.json()["invoice_email_sent_at"]

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(
            "backend.api.invoices.send_invoice_email",
            lambda recipient, values: pytest.fail("A duplicate invoice email was sent"),
        )
        response = api.post(f"/invoices/{invoice['id']}/send", json={"resend": False})
    assert response.status_code == 409
    assert db.get(Invoice, invoice["id"]).status == "sent"

    sent_invoice = db.get(Invoice, invoice["id"])
    sent_at = sent_invoice.invoice_email_sent_at - timedelta(seconds=1)
    sent_invoice.invoice_email_sent_at = sent_at
    sent_invoice.status = "draft"
    db.commit()
    assert api.post(f"/invoices/{invoice['id']}/send", json={"resend": False}).status_code == 409

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr("backend.api.invoices.send_invoice_email", lambda recipient, values: True)
        response = api.post(f"/invoices/{invoice['id']}/send", json={
            "resend": True,
            "expected_sent_at": sent_at.isoformat(),
        })
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "sent"
    assert response.json()["invoice_email_sent_at"] != sent_at.isoformat()
    assert api.post(f"/invoices/{invoice['id']}/send", json={
        "resend": True,
        "expected_sent_at": sent_at.isoformat(),
    }).status_code == 409


@pytest.mark.parametrize("status", ["paid", "cancelled", "overdue", "sent"])
def test_invoice_send_and_resend_preserve_non_draft_status(system, status):
    api, db, client = system
    service = db.query(Service).filter_by(name="Custom Static Invitation").one()
    invoice = api.post("/invoices", json=payload(client, service_id=service.id)).json()
    saved_invoice = db.get(Invoice, invoice["id"])
    saved_invoice.status = status
    db.commit()

    sends = []
    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(
            "backend.api.invoices.send_invoice_email",
            lambda recipient, values: sends.append((recipient, values)) or True,
        )
        response = api.post(f"/invoices/{invoice['id']}/send", json={"resend": False})
    assert response.status_code == 200, response.text
    sent_at = response.json()["invoice_email_sent_at"]
    assert response.json()["status"] == status

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(
            "backend.api.invoices.send_invoice_email",
            lambda recipient, values: sends.append((recipient, values)) or True,
        )
        response = api.post(f"/invoices/{invoice['id']}/send", json={
            "resend": True,
            "expected_sent_at": sent_at,
        })
    assert response.status_code == 200, response.text
    assert response.json()["status"] == status
    assert len(sends) == 2


def test_invoice_archive_failure_does_not_retry_delivery(monkeypatch):
    deliveries = []
    monkeypatch.setenv("PURELYMAIL_INFO_PASSWORD", "server-only-test-secret")
    monkeypatch.setattr(
        invoice_email,
        "deliver_via_purelymail",
        lambda box, message, recipient: deliveries.append((box, message, recipient)),
    )
    monkeypatch.setattr(invoice_email, "archive_sent_copy", lambda box, message: False)
    values = {
        "invoice_number": "INV-123",
        "client_name": "Test Client",
        "client_email": "client@example.com",
        "project_name": "Website",
        "notes": "Description",
        "issue_date": "2026-11-02",
        "due_date": "2026-11-30",
        "product_name": "Website",
        "product_price": "1000.00",
        "addons": "No add-ons",
        "subtotal": "1000.00",
        "discount_percent": "0.00",
        "discount_amount": "0.00",
        "amount": "1000.00",
        "bank_name": "Test Bank",
        "account_holder": "Test Account Holder",
        "account_number": "TEST-ACCOUNT",
        "account_type": "Test Account Type",
        "branch_code": "TEST-BRANCH",
    }

    assert invoice_email.send_invoice_email("client@example.com", values) is False
    assert len(deliveries) == 1


def test_purelymail_sent_copy_is_appended_to_sent_folder(monkeypatch):
    append_calls = []
    imap_client = SimpleNamespace(
        append=lambda *args: append_calls.append(args) or ("OK", [])
    )
    monkeypatch.setattr(mailbox_service, "connect", lambda box: nullcontext(imap_client))
    message = EmailMessage()
    message["Subject"] = "Invoice archive test"
    message.set_content("Test")

    assert mailbox_service.archive_sent_copy(
        {"address": "info@oatle-technologies.co.za", "password": "test"},
        message,
    )
    assert len(append_calls) == 1
    assert append_calls[0][0:2] == ("Sent", "\\Seen")
    assert b"Subject: Invoice archive test" in append_calls[0][3]


def test_invoice_send_failure_does_not_change_status(system):
    api, db, client = system
    service = db.query(Service).filter_by(name="Custom Static Invitation").one()
    invoice = api.post("/invoices", json=payload(client, service_id=service.id)).json()

    from fastapi import HTTPException

    with pytest.MonkeyPatch.context() as monkeypatch:
        monkeypatch.setattr(
            "backend.api.invoices.send_invoice_email",
            lambda recipient, values: (_ for _ in ()).throw(HTTPException(502, "SMTP unavailable")),
        )
        response = api.post(f"/invoices/{invoice['id']}/send", json={"resend": False})

    assert response.status_code == 502
    assert db.get(Invoice, invoice["id"]).status == "draft"
    assert db.get(Invoice, invoice["id"]).invoice_email_sent_at is None


def test_fixed_rand_discount_is_exact_and_survives_payment_updates(system):
    api, db, client = system
    service = db.query(Service).filter_by(name='Animated Digital Invitation').one()
    result = api.post('/invoices', json=payload(client, service_id=service.id, discount_fixed=50)).json()
    assert result['amount'] == 300
    assert result['discount_fixed'] == 50 and result['discount_percent'] == 0
    service.base_price = 999
    db.commit()
    response = api.put(f"/invoices/{result['id']}", json=payload(client, service_id=service.id, payment_amount=100))
    assert response.status_code == 200, response.text
    assert response.json()['amount'] == 300 and response.json()['discount_fixed'] == 50
    assert response.json()['balance_due'] == 200
    assert api.put(f"/invoices/{result['id']}", json=payload(client, service_id=service.id, discount_fixed=25)).status_code == 400
    assert api.put(f"/invoices/{result['id']}", json=payload(client, service_id=service.id, discount_percent=10)).status_code == 400


@pytest.mark.parametrize('discount,total', [(0, 350), (50.05, 299.95), (350, 0)])
def test_fixed_discount_cent_values_and_boundaries(system, discount, total):
    api, db, client = system
    service = db.query(Service).filter_by(name='Animated Digital Invitation').one()
    response = api.post('/invoices', json=payload(client, service_id=service.id, discount_fixed=discount))
    assert response.status_code == 200, response.text
    assert response.json()['amount'] == total
    assert response.json()['discount_fixed'] == discount


@pytest.mark.parametrize('extra', [dict(discount_fixed=-1), dict(discount_fixed=350.01), dict(discount_fixed=0.001), dict(discount_fixed=50, discount_percent=10), dict(discount_fixed=50, payment_amount=300.01)])
def test_invalid_fixed_discounts_and_overpayments_are_rejected(system, extra):
    api, db, client = system
    service = db.query(Service).filter_by(name='Animated Digital Invitation').one()
    assert api.post('/invoices', json=payload(client, service_id=service.id, **extra)).status_code == 400
    assert db.query(Invoice).count() == 0


def test_fixed_discount_on_project_includes_agreed_addons(system):
    api, db, client = system
    product = db.query(Product).filter_by(name='Marketing Page').one()
    project = Project(client_id=client.id, product_id=product.id, name='Fixed discount project', plan=product.name)
    db.add(project); db.flush()
    addon = db.query(AddOn).filter_by(name='Google Business Profile Setup').one()
    db.add(ProjectAddOn(project_id=project.id, addon_id=addon.id, price_at_selection=500)); db.commit()
    response = api.post('/invoices', json=payload(client, project_id=project.id, discount_fixed=50))
    assert response.status_code == 200, response.text
    assert response.json()['amount'] == 3450
    assert response.json()['discount_fixed'] == 50


def test_discount_currency_rounds_half_cents_and_rejects_nonfinite():
    from fastapi import HTTPException
    from backend.api.invoices import discounted_total
    assert discounted_total(0.05, 10) == 0.04
    assert discounted_total(350, 10) == 315
    for value in [float('nan'), float('inf')]:
        with pytest.raises(HTTPException):
            discounted_total(350, 0, value)
