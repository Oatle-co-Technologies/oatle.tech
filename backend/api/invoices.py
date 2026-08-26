from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.dependencies import get_admin_staff
from backend.models.invoice import Invoice
from backend.models.project import Project
from backend.models.pricing import AddOn, Product
from backend.models.project_addon import ProjectAddOn
from backend.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
)

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
    dependencies=[Depends(get_admin_staff)],
)


def calculate_project_amount(
    project: Project,
    quoted_amount: float | None,
    discount_percent: float,
    db: Session,
) -> float:
    """
    Calculate the invoice amount from the project's
    selected product plus all active add-ons assigned
    to the project, then apply the invoice discount.
    """

    if discount_percent < 0 or discount_percent > 100:
        raise HTTPException(
            status_code=400,
            detail="Discount must be between 0 and 100 percent",
        )

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

    if product.base_price is not None:
        subtotal = float(product.base_price)
    elif quoted_amount is not None:
        subtotal = float(quoted_amount)
    else:
        raise HTTPException(
            status_code=400,
            detail="A quoted amount is required for this product",
        )

    project_addons = (
        db.query(AddOn)
        .join(
            ProjectAddOn,
            ProjectAddOn.addon_id == AddOn.id,
        )
        .filter(
            ProjectAddOn.project_id == project.id,
            AddOn.active == True,
        )
        .all()
    )

    subtotal += sum(
        float(addon.price)
        for addon in project_addons
    )

    discount_amount = subtotal * (
        discount_percent / 100
    )

    return subtotal - discount_amount


@router.get(
    "",
    response_model=list[InvoiceResponse],
)
def get_invoices(
    db: Session = Depends(get_db),
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
):
    if invoice.project_id is None:
        raise HTTPException(
            status_code=400,
            detail="A project is required to create an invoice",
        )

    project = (
        db.query(Project)
        .filter(Project.id == invoice.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    amount = calculate_project_amount(
        project=project,
        quoted_amount=None,
        discount_percent=invoice.discount_percent,
        db=db,
    )

    new_invoice = Invoice(
        client_id=invoice.client_id,
        project_id=invoice.project_id,
        discount_percent=invoice.discount_percent,
        amount=amount,
        status=invoice.status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        notes=invoice.notes,
    )

    db.add(new_invoice)
    db.flush()

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


@router.put(
    "/{invoice_id}",
    response_model=InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
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

    if invoice_data.project_id is None:
        raise HTTPException(
            status_code=400,
            detail="A project is required for an invoice",
        )

    project = (
        db.query(Project)
        .filter(Project.id == invoice_data.project_id)
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    amount = calculate_project_amount(
        project=project,
        quoted_amount=None,
        discount_percent=invoice_data.discount_percent,
        db=db,
    )

    invoice.client_id = invoice_data.client_id
    invoice.project_id = invoice_data.project_id
    invoice.discount_percent = invoice_data.discount_percent
    invoice.amount = amount
    invoice.status = invoice_data.status
    invoice.issue_date = invoice_data.issue_date
    invoice.due_date = invoice_data.due_date
    invoice.notes = invoice_data.notes

    if invoice_data.status == "paid":
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