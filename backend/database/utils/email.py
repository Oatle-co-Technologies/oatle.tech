import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

load_dotenv()


def send_invoice_email(
    client_email: str,
    client_name: str,
    invoice_number: str,
    amount: float,
    due_date: str,
):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not all(
        [smtp_host, smtp_username, smtp_password]
    ):
        raise ValueError("SMTP configuration is incomplete")

    message = EmailMessage()

    message["Subject"] = f"Invoice {invoice_number} - Oatle Technologies"
    message["From"] = smtp_username
    message["To"] = client_email

    message.set_content(
        f"""Hi {client_name},

Please find your invoice from Oatle Technologies.

Invoice number: {invoice_number}
Amount: R{amount:,.2f}
Due date: {due_date}

If you have any questions regarding this invoice, please contact us.

Kind regards,
Oatle Technologies
"""
    )

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)