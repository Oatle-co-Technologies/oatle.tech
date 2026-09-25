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

BREVO_LEAD_SENDER_EMAIL = os.getenv(
    "BREVO_LEAD_SENDER_EMAIL",
    "communications@oatle-technologies.co.za",
)

BREVO_LEAD_SENDER_NAME = os.getenv(
    "BREVO_LEAD_SENDER_NAME",
    BREVO_SENDER_NAME,
)


# ============================================================
# OATLE EMAIL BRANDING
# ============================================================

# IMPORTANT:
# Replace this with the PUBLIC HTTPS URL of your actual
# Oatle Technologies logo image.
#
# Example:
# https://www.yourdomain.co.za/images/oatle-logo.png

OATLE_LOGO_URL = "YOUR_PUBLIC_OATLE_LOGO_URL"


FACEBOOK_URL = "https://www.facebook.com/oatle.tech"

INSTAGRAM_URL = "https://www.instagram.com/oatle.tech/"

TIKTOK_URL = "https://www.tiktok.com/@vinoliacode?lang=en-GB"

WHATSAPP_NUMBER = "2779532581"

WHATSAPP_URL = f"https://wa.me/{WHATSAPP_NUMBER}"

OATLE_REPLY_EMAIL = "info@oatle-technologies.co.za"


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
    Send a follow-up email to a lead or client from the
    Oatle Technologies communications address.

    Replies are directed to:
    info@oatle-technologies.co.za
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

    # ========================================================
    # OATLE BRANDED EMAIL
    # ========================================================

    html_content = f"""
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="x-apple-disable-message-reformatting"
    >

    <title>{safe_subject}</title>

</head>


<body
    style="
        margin:0;
        padding:0;
        background:#f4f4f2;
        font-family:Arial, Helvetica, sans-serif;
        color:#171717;
    "
>


<table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
        width:100%;
        margin:0;
        padding:0;
        background:#f4f4f2;
    "
>

    <tr>

        <td
            align="center"
            style="
                padding:24px 12px;
            "
        >


            <!-- EMAIL CONTAINER -->

            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                    width:100%;
                    max-width:620px;
                    background:#ffffff;
                    border:1px solid #e5e5e5;
                "
            >


                <!-- LOGO -->

                <tr>

                    <td
                        style="
                            padding:24px 28px 12px 28px;
                        "
                    >

                        <a
                            href="https://www.technologies.co.za"
                            target="_blank"
                            style="
                                text-decoration:none;
                            "
                        >

                            <img
                                src="{OATLE_LOGO_URL}"
                                alt="Oatle Technologies"
                                width="170"
                                style="
                                    display:block;
                                    width:170px;
                                    max-width:100%;
                                    height:auto;
                                    border:0;
                                "
                            >

                        </a>

                    </td>

                </tr>


                <!-- MESSAGE -->

                <tr>

                    <td
                        style="
                            padding:18px 28px 24px 28px;
                        "
                    >

                        <div
                            style="
                                font-size:16px;
                                line-height:1.65;
                                color:#222222;
                            "
                        >

                            <p
                                style="
                                    margin:0 0 20px 0;
                                "
                            >
                                Hi {safe_name},
                            </p>

                            <div>
                                {html_message}
                            </div>

                        </div>

                    </td>

                </tr>


                <!-- SIGNATURE -->

                <tr>

                    <td
                        style="
                            padding:0 28px 18px 28px;
                        "
                    >

                        <!-- GOLD ACCENT -->

                        <table
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                        >

                            <tr>

                                <td
                                    style="
                                        width:55px;
                                        height:3px;
                                        background:#d4af37;
                                        font-size:0;
                                        line-height:0;
                                    "
                                >
                                    &nbsp;
                                </td>

                            </tr>

                        </table>


                        <p
                            style="
                                margin:18px 0 3px 0;
                                font-size:14px;
                                line-height:1.5;
                                color:#555555;
                            "
                        >
                            Kind regards,
                        </p>


                        <p
                            style="
                                margin:0;
                                font-size:17px;
                                line-height:1.4;
                                font-weight:700;
                                color:#171717;
                            "
                        >
                            Oatle Technologies
                        </p>


                        <p
                            style="
                                margin:3px 0 0 0;
                                font-size:13px;
                                line-height:1.5;
                                color:#777777;
                            "
                        >
                            Grow. Multiply. Succeed.
                        </p>

                    </td>

                </tr>


                <!-- SOCIAL ICONS -->

                <tr>

                    <td
                        style="
                            padding:4px 28px 10px 28px;
                        "
                    >

                        <table
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                        >

                            <tr>


                                <!-- FACEBOOK -->

                                <td
                                    style="
                                        padding-right:10px;
                                    "
                                >

                                    <a
                                        href="{FACEBOOK_URL}"
                                        target="_blank"
                                        style="
                                            text-decoration:none;
                                        "
                                    >

                                        <img
                                            src="https://cdn.simpleicons.org/facebook/1877F2"
                                            alt="Facebook"
                                            width="28"
                                            height="28"
                                            style="
                                                display:block;
                                                width:28px;
                                                height:28px;
                                                border:0;
                                            "
                                        >

                                    </a>

                                </td>


                                <!-- INSTAGRAM -->

                                <td
                                    style="
                                        padding-right:10px;
                                    "
                                >

                                    <a
                                        href="{INSTAGRAM_URL}"
                                        target="_blank"
                                        style="
                                            text-decoration:none;
                                        "
                                    >

                                        <img
                                            src="https://cdn.simpleicons.org/instagram/E4405F"
                                            alt="Instagram"
                                            width="28"
                                            height="28"
                                            style="
                                                display:block;
                                                width:28px;
                                                height:28px;
                                                border:0;
                                            "
                                        >

                                    </a>

                                </td>


                                <!-- TIKTOK -->

                                <td
                                    style="
                                        padding-right:10px;
                                    "
                                >

                                    <a
                                        href="{TIKTOK_URL}"
                                        target="_blank"
                                        style="
                                            text-decoration:none;
                                        "
                                    >

                                        <img
                                            src="https://cdn.simpleicons.org/tiktok/000000"
                                            alt="TikTok"
                                            width="28"
                                            height="28"
                                            style="
                                                display:block;
                                                width:28px;
                                                height:28px;
                                                border:0;
                                            "
                                        >

                                    </a>

                                </td>


                                <!-- WHATSAPP -->

                                <td>

                                    <a
                                        href="{WHATSAPP_URL}"
                                        target="_blank"
                                        style="
                                            text-decoration:none;
                                        "
                                    >

                                        <img
                                            src="https://cdn.simpleicons.org/whatsapp/25D366"
                                            alt="WhatsApp"
                                            width="28"
                                            height="28"
                                            style="
                                                display:block;
                                                width:28px;
                                                height:28px;
                                                border:0;
                                            "
                                        >

                                    </a>

                                </td>


                            </tr>

                        </table>

                    </td>

                </tr>


                <!-- EMAIL CONTACT -->

                <tr>

                    <td
                        style="
                            padding:0 28px 24px 28px;
                        "
                    >

                        <a
                            href="mailto:info@oatle-technologies.co.za"
                            style="
                                font-size:12px;
                                line-height:1.5;
                                color:#777777;
                                text-decoration:none;
                            "
                        >
                            info@oatle-technologies.co.za
                        </a>

                    </td>

                </tr>


                <!-- FOOTER -->

                <tr>

                    <td
                        style="
                            padding:12px 28px;
                            background:#fafafa;
                            border-top:1px solid #eeeeee;
                        "
                    >

                        <p
                            style="
                                margin:0;
                                font-size:10px;
                                line-height:1.5;
                                color:#999999;
                            "
                        >
                            Oatle Technologies
                        </p>

                    </td>

                </tr>


            </table>

        </td>

    </tr>

</table>


</body>
</html>
"""

    # ========================================================
    # BREVO TRANSACTIONAL EMAIL PAYLOAD
    # ========================================================

    payload = {
        "sender": {
            "name": BREVO_LEAD_SENDER_NAME,
            "email": BREVO_LEAD_SENDER_EMAIL,
        },

        # Replies go to the Oatle info address.
        # The visible/sending address remains unchanged.
        "replyTo": {
            "name": "Oatle Technologies",
            "email": OATLE_REPLY_EMAIL,
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