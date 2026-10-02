from datetime import date

from backend.models.invoice import Invoice, InvoicePayment


def test_invoice_totals_accumulate_all_payments():
    invoice = Invoice(
        client_id=1,
        amount=1_000,
        issue_date=date.today(),
    )
    invoice.payments = [
        InvoicePayment(amount=250),
        InvoicePayment(amount=300),
    ]

    assert invoice.total_paid == 550
    assert invoice.balance_due == 450


def test_fully_paid_invoice_has_zero_balance():
    invoice = Invoice(
        client_id=1,
        amount=1_000,
        issue_date=date.today(),
    )
    invoice.payments = [
        InvoicePayment(amount=400),
        InvoicePayment(amount=600),
    ]

    assert invoice.total_paid == 1_000
    assert invoice.balance_due == 0


def test_legacy_paid_amount_is_used_until_backfilled():
    invoice = Invoice(
        client_id=1,
        amount=1_000,
        legacy_amount_paid=350,
        issue_date=date.today(),
    )
    invoice.payments = []

    assert invoice.total_paid == 350
    assert invoice.balance_due == 650
