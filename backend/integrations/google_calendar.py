import os
import json

from datetime import datetime

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/calendar.freebusy",
    "https://www.googleapis.com/auth/calendar.events",
]


def get_calendar_credentials():
    """
    Create Google Calendar credentials.

    Uses the JSON stored in GOOGLE_SERVICE_ACCOUNT_JSON when
    running in production, and falls back to the local JSON file
    during development.
    """

    service_account_json = os.getenv(
        "GOOGLE_SERVICE_ACCOUNT_JSON"
    )

    if service_account_json:
        try:
            service_account_info = json.loads(
                service_account_json
            )

            credentials = (
                service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=SCOPES,
                )
            )

            return credentials

        except json.JSONDecodeError as e:
            raise RuntimeError(
                "GOOGLE_SERVICE_ACCOUNT_JSON contains invalid JSON."
            ) from e

    service_account_file = os.getenv(
        "GOOGLE_SERVICE_ACCOUNT_FILE"
    )

    if not service_account_file:
        raise RuntimeError(
            "Neither GOOGLE_SERVICE_ACCOUNT_JSON nor "
            "GOOGLE_SERVICE_ACCOUNT_FILE is configured."
        )

    credentials = (
        service_account.Credentials.from_service_account_file(
            service_account_file,
            scopes=SCOPES,
        )
    )

    return credentials


def get_calendar_id():
    """
    Return the Google Calendar ID used by the appointment system.
    """

    calendar_id = os.getenv("GOOGLE_CALENDAR_ID")

    if not calendar_id:
        raise RuntimeError(
            "GOOGLE_CALENDAR_ID is not configured."
        )

    return calendar_id


def build_calendar_service():
    """
    Build an authenticated Google Calendar API service
    using the service account.
    """

    credentials = get_calendar_credentials()

    return build(
        "calendar",
        "v3",
        credentials=credentials,
    )


def get_free_busy(
    start_time: datetime,
    end_time: datetime,
):
    """
    Get busy periods from the Oatle Technologies calendar.
    """

    if end_time <= start_time:
        raise ValueError(
            "End time must be after start time."
        )

    service = build_calendar_service()
    calendar_id = get_calendar_id()

    body = {
        "timeMin": start_time.isoformat(),
        "timeMax": end_time.isoformat(),
        "items": [
            {
                "id": calendar_id
            }
        ],
    }

    response = (
        service.freebusy()
        .query(body=body)
        .execute()
    )

    return response["calendars"][calendar_id]["busy"]


def create_calendar_event(
    summary: str,
    description: str | None,
    start_time: datetime,
    end_time: datetime,
    attendee_email: str | None = None,
    location: str | None = None,
):
    """
    Create an appointment event on the Oatle Technologies calendar.
    """

    if end_time <= start_time:
        raise ValueError(
            "End time must be after start time."
        )

    service = build_calendar_service()
    calendar_id = get_calendar_id()

    event = {
        "summary": summary,
        "description": description or "",
        "start": {
            "dateTime": start_time.isoformat(),
            "timeZone": "Africa/Johannesburg",
        },
        "end": {
            "dateTime": end_time.isoformat(),
            "timeZone": "Africa/Johannesburg",
        },
    }

    if location:
        event["location"] = location

    if attendee_email:
        event["attendees"] = [
            {
                "email": attendee_email
            }
        ]

    created_event = (
        service.events()
        .insert(
            calendarId=calendar_id,
            body=event,
            sendUpdates="all",
        )
        .execute()
    )

    return created_event