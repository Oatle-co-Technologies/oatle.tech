import html
import os
import re
from email.message import EmailMessage
from email.utils import formataddr, formatdate, make_msgid
from pathlib import Path

from fastapi import HTTPException

from backend.models.client import Client
from backend.models.invoice import Invoice
from backend.models.pricing import AddOn, Product, Service
from backend.models.project import Project
from backend.models.project_addon import ProjectAddOn
from backend.services.mailbox_service import archive_sent_copy, deliver_via_purelymail


INVOICE_SENDER = "info@oatle-technologies.co.za"
INVOICE_TEMPLATE = Path(__file__).parents[1] / "templates" / "invoice_email.html"
BANKING_ENVIRONMENT_KEYS = {
    "bank_name": "INVOICE_BANK_NAME",
    "account_holder": "INVOICE_BANK_ACCOUNT_HOLDER",
    "account_number": "INVOICE_BANK_ACCOUNT_NUMBER",
    "account_type": "INVOICE_BANK_ACCOUNT_TYPE",
    "branch_code": "INVOICE_BANK_BRANCH_CODE",
}


def invoice_banking_details():
    details = {
        key: os.getenv(environment_key, "").strip()
        for key, environment_key in BANKING_ENVIRONMENT_KEYS.items()
    }
    if not all(details.values()):
        raise HTTPException(503, "Invoice banking details are not configured.")
    return details


def invoice_template_values(invoice, client, project, product, addons):
    addon_total = sum(float(price) for _, price in addons)
    if invoice.discount_fixed is not None:
        discount_amount = float(invoice.discount_fixed)
        subtotal = float(invoice.amount) + discount_amount
    else:
        discount_percent = float(invoice.discount_percent or 0)
        subtotal = (
            float(invoice.amount) / (1 - discount_percent / 100)
            if discount_percent < 100
            else float(product.base_price or 0) + addon_total
        )
        discount_amount = subtotal - float(invoice.amount)

    product_price = max(0, subtotal - addon_total)
    effective_discount_percent = (
        discount_amount / subtotal * 100 if invoice.discount_fixed is not None and subtotal > 0
        else float(invoice.discount_percent or 0)
    )
    addon_lines = [
        f"{addon.name} — R{float(price):.2f}"
        for addon, price in addons
    ]

    return {
        "invoice_number": invoice.invoice_number,
        "client_name": client.name,
        "client_email": client.email,
        "project_name": project.name if project else product.name,
        "notes": invoice.notes or (project.notes if project else None) or "Thank you for choosing Oatle Technologies.",
        "issue_date": invoice.issue_date.isoformat(),
        "due_date": invoice.due_date.isoformat() if invoice.due_date else "Not specified",
        "product_name": product.name,
        "product_price": f"{product_price:.2f}",
        "addons": "\n".join(addon_lines) if addon_lines else "No add-ons",
        "subtotal": f"{subtotal:.2f}",
        "discount_percent": f"{effective_discount_percent:.2f}",
        "discount_amount": f"{discount_amount:.2f}",
        "amount": f"{float(invoice.balance_due):.2f}",
    }


def render_invoice_html(values):
    template = INVOICE_TEMPLATE.read_text(encoding="utf-8")

    def replace_placeholder(match):
        key = match.group(1)
        if key not in values:
            raise ValueError(f"Unknown invoice email placeholder: {key}")
        value = values[key]
        safe_value = html.escape(str(value), quote=True)
        if key in {"notes", "addons"}:
            safe_value = safe_value.replace("\n", "<br>")
        return safe_value

    return re.sub(r"\{\{([a-z_]+)\}\}", replace_placeholder, template)


def invoice_plain_text(values):
    return f"""Invoice {values['invoice_number']} — Oatle Technologies

Billed to: {values['client_name']}
Email: {values['client_email']}
Project: {values['project_name']}
Description: {values['notes']}
Issue date: {values['issue_date']}
Due date: {values['due_date']}

{values['product_name']}: R{values['product_price']}
Add-ons:
{values['addons']}
Subtotal: R{values['subtotal']}
Discount ({values['discount_percent']}%): - R{values['discount_amount']}
Amount due: R{values['amount']}

Bank: {values['bank_name']}
Account holder: {values['account_holder']}
Account number: {values['account_number']}
Account type: {values['account_type']}
Branch code: {values['branch_code']}
Payment reference: {values['invoice_number']}

Thank you for choosing Oatle Technologies. Please make payment by the due date indicated above.
If you have any questions regarding this invoice, please reply directly to this email.
"""


def build_invoice_email(invoice, db):
    client = db.query(Client).filter(Client.id == invoice.client_id).first()
    if not client or not client.email:
        raise HTTPException(400, "The invoice client has no email address.")

    project = None
    if invoice.project_id:
        project = db.query(Project).filter(Project.id == invoice.project_id).first()
        if not project or project.client_id != invoice.client_id or not project.product_id:
            raise HTTPException(400, "The invoice project is unavailable or has no product.")
        product = db.query(Product).filter(Product.id == project.product_id).first()
        if not product:
            raise HTTPException(400, "The invoice product could not be found.")
        addons = db.query(AddOn, ProjectAddOn.price_at_selection).join(
            ProjectAddOn, ProjectAddOn.addon_id == AddOn.id
        ).filter(ProjectAddOn.project_id == project.id).all()
    elif invoice.service_id:
        product = db.query(Service).filter(Service.id == invoice.service_id).first()
        if not product:
            raise HTTPException(400, "The invoice service could not be found.")
        addons = []
    else:
        raise HTTPException(400, "The invoice does not have a project or service assigned.")

    values = invoice_template_values(invoice, client, project, product, addons)
    values.update(invoice_banking_details())
    return client.email, values


def send_invoice_email(recipient, values):
    password = os.getenv("PURELYMAIL_INFO_PASSWORD", "")
    if not password:
        raise HTTPException(503, "Invoice email sending is not configured.")

    message = EmailMessage()
    message["From"] = formataddr(("Oatle Technologies", INVOICE_SENDER))
    message["Reply-To"] = INVOICE_SENDER
    message["To"] = recipient
    message["Subject"] = f"Invoice {values['invoice_number']} - Oatle Technologies"
    message["Date"] = formatdate(localtime=False)
    message["Message-ID"] = make_msgid(domain=INVOICE_SENDER.split("@")[-1])
    message.set_content(invoice_plain_text(values))
    message.add_alternative(render_invoice_html(values), subtype="html")

    sender_box = {"address": INVOICE_SENDER, "password": password}
    deliver_via_purelymail(sender_box, message, recipient)
    return archive_sent_copy(sender_box, message)
