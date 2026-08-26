import html
import logging
import os

import requests
from dotenv import load_dotenv

from backend.database.connection import BASE_DIR


load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger(__name__)


# ============================================================
# BREVO CONFIGURATION
# ============================================================

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

BREVO_API_KEY = os.getenv("BREVO_API_KEY")


# ------------------------------------------------------------
# Default sender
# ------------------------------------------------------------
#
# Kept for compatibility with the existing setup.
#
# If the specialised sender variables below are not present,
# this sender will be used as the fallback.
#

BREVO_SENDER_EMAIL = os.getenv(
    "BREVO_SENDER_EMAIL",
    "communications@oatle-technologies.co.za",
)

BREVO_SENDER_NAME = os.getenv(
    "BREVO_SENDER_NAME",
    "Oatle Technologies",
)


# ------------------------------------------------------------
# Task notification sender
# ------------------------------------------------------------
#
# This allows task notifications to continue using the
# notifications sender if configured.
#
# Example:
#
# BREVO_TASK_SENDER_EMAIL=notifications@oatle-technologies.co.za
# BREVO_TASK_SENDER_NAME=Oatle Technologies
#

BREVO_TASK_SENDER_EMAIL = os.getenv(
    "BREVO_TASK_SENDER_EMAIL",
    "notifications@oatle-technologies.co.za",
)

BREVO_TASK_SENDER_NAME = os.getenv(
    "BREVO_TASK_SENDER_NAME",
    BREVO_SENDER_NAME,
)


# ------------------------------------------------------------
# Lead communication sender
# ------------------------------------------------------------
#
# Lead follow-up emails are intentionally sent from the
# communications address.
#
# Example:
#
# BREVO_LEAD_SENDER_EMAIL=communications@oatle-technologies.co.za
# BREVO_LEAD_SENDER_NAME=Oatle Technologies
#

BREVO_LEAD_SENDER_EMAIL = os.getenv(
    "BREVO_LEAD_SENDER_EMAIL",
    "communications@oatle-technologies.co.za",
)

BREVO_LEAD_SENDER_NAME = os.getenv(
    "BREVO_LEAD_SENDER_NAME",
    BREVO_SENDER_NAME,
)


# ============================================================
# BREVO HEADERS
# ============================================================

def get_brevo_headers():
    """
    Return the headers required by the Brevo transactional
    email API.
    """

    return {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }


# ============================================================
# TASK ASSIGNMENT EMAIL
# ============================================================

def send_task_assignment_email(
    recipient_email: str,
    recipient_name: str,
    task_name: str,
    task_description: str | None = None,
    due_date=None,
    priority: str | None = None,
):
    """
    Send an email notification when a staff member
    is assigned a task.

    This uses the task notification sender.
    """

    if not BREVO_API_KEY:
        logger.error(
            "BREVO_API_KEY is not configured."
        )
        return False

    if not recipient_email:
        logger.error(
            "Task recipient email address is missing."
        )
        return False

    description = (
        task_description
        or "No description provided."
    )

    due_date_text = (
        due_date.strftime("%Y-%m-%d")
        if due_date
        else "No due date"
    )

    priority_text = (
        priority
        or "Not specified"
    )

    subject = (
        f"New Task Assigned: {task_name}"
    )

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
                Hi {html.escape(recipient_name)},
            </p>

            <p style="
                font-size: 16px;
                line-height: 1.6;
            ">
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
                    {html.escape(task_name)}
                </h2>

                <p>
                    <strong>Description:</strong><br>
                    {html.escape(description)}
                </p>

                <p>
                    <strong>Priority:</strong>
                    {html.escape(priority_text)}
                </p>

                <p>
                    <strong>Due date:</strong>
                    {html.escape(due_date_text)}
                </p>

            </div>

            <p style="
                font-size: 15px;
                line-height: 1.6;
            ">
                Please log in to the Oatle Technologies
                dashboard to view and manage your task.
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
            "name": BREVO_TASK_SENDER_NAME,
            "email": BREVO_TASK_SENDER_EMAIL,
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

    response = None

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=get_brevo_headers(),
            timeout=10,
        )

        response.raise_for_status()

        logger.info(
            "Task assignment email sent to %s",
            recipient_email,
        )

        logger.info(
            "Brevo response: %s",
            response.text,
        )

        return True

    except requests.RequestException as exc:

        logger.error(
            "Failed to send task assignment email "
            "to %s: %s",
            recipient_email,
            exc,
        )

        if response is not None:
            logger.error(
                "Brevo status: %s",
                response.status_code,
            )

            logger.error(
                "Brevo response: %s",
                response.text,
            )

        return False


# ============================================================
# LEAD FOLLOW-UP EMAIL
# ============================================================

def send_lead_follow_up_email(
    recipient_email: str,
    recipient_name: str,
    subject: str,
    message: str,
):
    """
    Send a follow-up email to a lead from the
    Oatle Technologies communications address.

    The communication specialist provides the subject
    and message from the dashboard.

    This email is sent through Brevo using the verified
    communications@oatle-technologies.co.za sender.
    """

    if not BREVO_API_KEY:
        logger.error(
            "BREVO_API_KEY is not configured."
        )
        return False

    if not recipient_email:
        logger.error(
            "Lead email address is missing."
        )
        return False

    if not recipient_name:
        recipient_name = "there"

    if not subject.strip():
        logger.error(
            "Lead follow-up email subject is empty."
        )
        return False

    if not message.strip():
        logger.error(
            "Lead follow-up email message is empty."
        )
        return False

    # --------------------------------------------------------
    # Escape user-provided content before placing it into HTML.
    # --------------------------------------------------------

    safe_name = html.escape(
        recipient_name
    )

    safe_subject = html.escape(
        subject
    )

    html_message = (
        html.escape(message)
        .replace("\r\n", "<br>")
        .replace("\n", "<br>")
        .replace("\r", "<br>")
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>

    <head>
        <meta charset="UTF-8">
        <title>{safe_subject}</title>
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

            <p style="
                font-size: 16px;
                line-height: 1.6;
            ">
                Hi {safe_name},
            </p>

            <div style="
                font-size: 16px;
                line-height: 1.7;
            ">
                {html_message}
            </div>

            <p style="
                margin-top: 35px;
                font-size: 14px;
                color: #777777;
            ">
                Kind regards,<br>
                <strong>Oatle Technologies</strong><br>
                Grow. Multiply. Succeed.
            </p>

        </div>

    </body>
    </html>
    """

    # --------------------------------------------------------
    # Brevo transactional email payload.
    #
    # We intentionally use htmlContent only.
    # Brevo documents htmlContent and textContent as
    # alternative body types for a request.
    # --------------------------------------------------------

    payload = {
        "sender": {
            "name": BREVO_LEAD_SENDER_NAME,
            "email": BREVO_LEAD_SENDER_EMAIL,
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

    response = None

    try:

        logger.info(
            "Sending lead follow-up email to %s "
            "from %s",
            recipient_email,
            BREVO_LEAD_SENDER_EMAIL,
        )

        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=get_brevo_headers(),
            timeout=10,
        )

        response.raise_for_status()

        logger.info(
            "Lead follow-up email sent successfully "
            "to %s",
            recipient_email,
        )

        logger.info(
            "Brevo response status: %s",
            response.status_code,
        )

        logger.info(
            "Brevo response: %s",
            response.text,
        )

        return True

    except requests.RequestException as exc:

        logger.error(
            "Failed to send lead follow-up email "
            "to %s: %s",
            recipient_email,
            exc,
        )

        # This is deliberately verbose while we are testing.
        # If Brevo rejects the request, the actual Brevo
        # response will appear in the backend logs.

        if response is not None:

            logger.error(
                "Brevo status: %s",
                response.status_code,
            )

            logger.error(
                "Brevo response: %s",
                response.text,
            )

        else:

            logger.error(
                "No HTTP response was received from Brevo."
            )

        return False