from datetime import datetime
import math
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict

from sqlalchemy.orm import Session

from backend.dependencies import get_admin_staff
from backend.database.connection import get_db
from backend.models.invoice import Invoice, InvoicePayment
from backend.models.project import Project
from backend.models.pricing import AddOn, Product, Service
from backend.models.client import Client
from backend.models.project_addon import ProjectAddOn
from backend.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceSendResponse,
    InvoiceUpdate,
)
from backend.services.invoice_email import build_invoice_email, send_invoice_email


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


class InvoiceSendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resend: bool = False
    expected_sent_at: datetime | None = None


def validate_discount(discount_percent: float) -> None:
    if not math.isfinite(discount_percent) or not 0 <= discount_percent <= 100:
        raise HTTPException(status_code=400, detail="Discount must be between 0 and 100 percent")


def discounted_total(subtotal: float, discount_percent: float, discount_fixed: float | None = None) -> float:
    """Calculate currency in decimal cents; a fixed discount never uses a percentage conversion."""
    validate_discount(discount_percent)
    base = Decimal(str(subtotal)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if discount_fixed is not None:
        if not math.isfinite(discount_fixed) or discount_fixed < 0:
            raise HTTPException(status_code=400, detail="Fixed discount must be a finite non-negative amount")
        reduction = Decimal(str(discount_fixed))
        if reduction != reduction.quantize(Decimal("0.01")):
            raise HTTPException(status_code=400, detail="Fixed discount must use at most two decimal places")
        if discount_percent != 0:
            raise HTTPException(status_code=400, detail="Choose either a fixed discount or a percentage discount")
        if reduction > base:
            raise HTTPException(status_code=400, detail="Fixed discount cannot exceed the invoice subtotal")
    else:
        reduction = (base * Decimal(str(discount_percent)) / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return float(base - reduction)


def catalogue_price(item, quoted_amount: float | None) -> float:
    if quoted_amount is not None and (not math.isfinite(quoted_amount) or quoted_amount < 0):
        raise HTTPException(status_code=400, detail="Quoted amount must be a finite non-negative amount")
    if item.pricing_type == "quoted":
        if quoted_amount is None:
            raise HTTPException(status_code=400, detail="A quoted amount is required for this item")
        return float(quoted_amount)
    if item.base_price is None or not math.isfinite(item.base_price) or item.base_price < 0:
        raise HTTPException(status_code=400, detail="A valid catalogue price is required for this item")
    if item.pricing_type == "starting" and quoted_amount is not None:
        if quoted_amount < item.base_price:
            raise HTTPException(status_code=400, detail="Agreed price cannot be below the catalogue starting price; use a discount instead")
        return float(quoted_amount)
    return float(item.base_price)


def invoice_target(project_id, service_id, client_id, db, *, require_active_service=True):
    if (project_id is None) == (service_id is None):
        raise HTTPException(status_code=400, detail="Select either a project or a standalone service")
    if not db.query(Client).filter(Client.id == client_id).first():
        raise HTTPException(status_code=404, detail="Client not found")
    if service_id is not None:
        service = db.query(Service).filter(Service.id == service_id).first()
        if not service or (require_active_service and not service.active):
            raise HTTPException(status_code=404, detail="Service not found")
        return None, service
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.client_id != client_id:
        raise HTTPException(status_code=400, detail="The selected project belongs to a different client")
    return project, None


def calculate_project_amount(
    project: Project,
    quoted_amount: float | None,
    discount_percent: float,
    db: Session,
    discount_fixed: float | None = None,
) -> float:
    """
    Calculate the invoice amount from the project's
    selected product plus the agreed prices of add-ons assigned
    to the project, then apply the invoice discount.
    """

    validate_discount(discount_percent)

    if project.product_id is None:
        raise HTTPException(
            status_code=400,
            detail="Project does not have a product assigned",
        )

    product = (
        db.query(Product)
        .filter(Product.id == project.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    subtotal = catalogue_price(product, quoted_amount)

    project_addons = (
        db.query(AddOn, ProjectAddOn.price_at_selection)
        .join(
            ProjectAddOn,
            ProjectAddOn.addon_id == AddOn.id,
        )
        .filter(
            ProjectAddOn.project_id == project.id,
        )
        .all()
    )

    subtotal += sum(
        float(selected_price)
        for addon, selected_price in project_addons
    )

    return discounted_total(subtotal, discount_percent, discount_fixed)


@router.get(
    "",
    response_model=list[InvoiceResponse],
)
def get_invoices(
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_staff),
):
    return (
        db.query(Invoice)
        .order_by(Invoice.created_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=InvoiceResponse,
)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_staff),
):
    project, service = invoice_target(invoice.project_id, invoice.service_id, invoice.client_id, db)
    validate_discount(invoice.discount_percent)
    amount = (
        discounted_total(catalogue_price(service, invoice.quoted_amount), invoice.discount_percent, invoice.discount_fixed)
        if service is not None else calculate_project_amount(
            project=project, quoted_amount=invoice.quoted_amount,
            discount_percent=invoice.discount_percent, db=db, discount_fixed=invoice.discount_fixed,
        )
    )

    if not math.isfinite(invoice.payment_amount) or invoice.payment_amount < 0 or invoice.payment_amount > amount:
        raise HTTPException(
            status_code=400,
            detail="Amount paid must be between zero and the invoice total",
        )

    status = invoice.status
    paid_at = None
    if invoice.payment_amount == amount:
        status = "paid"
        paid_at = datetime.utcnow()

    new_invoice = Invoice(
        client_id=invoice.client_id,
        project_id=invoice.project_id,
        service_id=invoice.service_id,
        discount_percent=invoice.discount_percent,
        discount_fixed=invoice.discount_fixed,
        amount=amount,
        status=status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        notes=invoice.notes,
        paid_at=paid_at,
    )

    db.add(new_invoice)
    db.flush()

    if invoice.payment_amount > 0:
        db.add(
            InvoicePayment(
                invoice_id=new_invoice.id,
                amount=invoice.payment_amount,
            )
        )

    new_invoice.invoice_number = (
        f"INV-{new_invoice.id:03d}"
    )

    db.commit()
    db.refresh(new_invoice)

    return new_invoice


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_staff),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    return invoice


@router.post("/{invoice_id}/send", response_model=InvoiceSendResponse)
def send_invoice(
    invoice_id: int,
    request: InvoiceSendRequest,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_staff),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .with_for_update()
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    already_sent = invoice.invoice_email_sent_at is not None
    if already_sent and (
        not request.resend or request.expected_sent_at != invoice.invoice_email_sent_at
    ):
        raise HTTPException(status_code=409, detail="This invoice has already been sent. Confirm a resend to send it again.")
    if not already_sent and (request.resend or request.expected_sent_at is not None):
        raise HTTPException(status_code=409, detail="Only a previously sent invoice can be resent.")

    try:
        recipient, values = build_invoice_email(invoice, db)
        sent_copy_saved = send_invoice_email(recipient, values)
    except HTTPException:
        db.rollback()
        raise

    if invoice.status == "draft":
        invoice.status = "sent"
    invoice.invoice_email_sent_at = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    response = InvoiceResponse.model_validate(invoice).model_dump()
    response["sent_copy_saved"] = sent_copy_saved
    return response


@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_staff),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    invoice_target(invoice_data.project_id, invoice_data.service_id, invoice_data.client_id, db,
                   require_active_service=False)
    validate_discount(invoice_data.discount_percent)
    if invoice_data.service_id != invoice.service_id:
        raise HTTPException(status_code=400, detail="Create a new invoice to change the billed service")

    # Keep both the saved discount and total together; payment/status edits cannot reprice history.
    if invoice_data.discount_percent != invoice.discount_percent or (
        "discount_fixed" in invoice_data.model_fields_set
        and invoice_data.discount_fixed != (float(invoice.discount_fixed) if invoice.discount_fixed is not None else None)
    ):
        raise HTTPException(status_code=400, detail="Create a new invoice to change its saved discount")

    # The invoice total is a historical value fixed when the invoice is
    # created. Project pricing changes must not rewrite it later.
    amount = float(invoice.amount)

    if (
        not math.isfinite(invoice_data.payment_amount)
        or invoice_data.payment_amount < 0
        or invoice.total_paid + invoice_data.payment_amount > amount
    ):
        raise HTTPException(
            status_code=400,
            detail="Payment must be positive and cannot exceed the balance due",
        )

    total_paid = invoice.total_paid + invoice_data.payment_amount

    if (
        invoice_data.status == "paid"
        and total_paid < amount
    ):
        raise HTTPException(
            status_code=400,
            detail="An invoice must be fully paid before it can be marked paid",
        )

    invoice.client_id = invoice_data.client_id
    invoice.project_id = invoice_data.project_id
    invoice.discount_percent = invoice_data.discount_percent
    invoice.status = (
        "paid"
        if total_paid == amount
        else invoice_data.status
    )
    invoice.issue_date = invoice_data.issue_date
    invoice.due_date = invoice_data.due_date
    invoice.notes = invoice_data.notes

    if invoice_data.payment_amount > 0:
        # Preserve the previous cumulative value as the first ledger entry
        # when this deployment reaches a database before the SQL backfill.
        if not invoice.payments and invoice.legacy_amount_paid > 0:
            db.add(
                InvoicePayment(
                    invoice_id=invoice.id,
                    amount=invoice.legacy_amount_paid,
                    paid_at=invoice.paid_at or invoice.created_at,
                )
            )
        db.add(
            InvoicePayment(
                invoice_id=invoice.id,
                amount=invoice_data.payment_amount,
            )
        )

    if invoice.status == "paid":
        if invoice.paid_at is None:
            invoice.paid_at = datetime.utcnow()
    else:
        invoice.paid_at = None

    db.commit()
    db.refresh(invoice)

    return invoice


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_admin_staff),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    db.delete(invoice)
    db.commit()

    return {
        "message": "Invoice deleted successfully"
    }
