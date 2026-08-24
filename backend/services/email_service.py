import logging
import os

import requests
from dotenv import load_dotenv

from backend.database.connection import BASE_DIR

load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv(
    "BREVO_SENDER_EMAIL",
    "notifications@oatle-technologies.co.za",
)
BREVO_SENDER_NAME = os.getenv(
    "BREVO_SENDER_NAME",
    "Oatle Technologies",
)


def send_task_assignment_email(
    recipient_email: str,
    recipient_name: str,
    task_name: str,
    task_description: str | None = None,
    due_date=None,
    priority: str | None = None,
):
    """
    Send an email notification when a staff member is assigned a task.
    """

    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY is not configured.")
        return False

    description = task_description or "No description provided."

    due_date_text = (
        due_date.strftime("%Y-%m-%d")
        if due_date
        else "No due date"
    )

    priority_text = priority or "Not specified"

    subject = f"New Task Assigned: {task_name}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>New Task Assigned</title>
    </head>

    <body style="
        margin: 0;
        padding: 0;
        background-color: #f7f7f7;
        font-family: Arial, Helvetica, sans-serif;
        color: #222222;
    ">

        <div style="
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            padding: 40px;
        ">

            <h1 style="
                margin-top: 0;
                font-size: 26px;
                color: #222222;
            ">
                New Task Assigned
            </h1>

            <p style="font-size: 16px;">
                Hi {recipient_name},
            </p>

            <p style="font-size: 16px; line-height: 1.6;">
                You have been assigned a new task at
                <strong>Oatle Technologies</strong>.
            </p>

            <div style="
                margin: 30px 0;
                padding: 24px;
                background: #fafafa;
                border-left: 4px solid #d4af37;
            ">

                <h2 style="
                    margin-top: 0;
                    font-size: 20px;
                ">
                    {task_name}
                </h2>

                <p>
                    <strong>Description:</strong><br>
                    {description}
                </p>

                <p>
                    <strong>Priority:</strong>
                    {priority_text}
                </p>

                <p>
                    <strong>Due date:</strong>
                    {due_date_text}
                </p>

            </div>

            <p style="
                font-size: 15px;
                line-height: 1.6;
            ">
                Please log in to the Oatle Technologies dashboard
                to view and manage your task.
            </p>

            <p style="
                margin-top: 35px;
                font-size: 14px;
                color: #777777;
            ">
                Oatle Technologies<br>
                Grow. Multiply. Succeed.
            </p>

        </div>

    </body>
    </html>
    """

    payload = {
        "sender": {
            "name": BREVO_SENDER_NAME,
            "email": BREVO_SENDER_EMAIL,
        },
        "to": [
            {
                "email": recipient_email,
                "name": recipient_name,
            }
        ],
        "subject": subject,
        "htmlContent": html_content,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=10,
        )

        response.raise_for_status()

        logger.info(
            "Task assignment email sent to %s",
            recipient_email,
        )

        return True

    except requests.RequestException as exc:
        logger.error(
            "Failed to send task assignment email to %s: %s",
            recipient_email,
            exc,
        )

        return False