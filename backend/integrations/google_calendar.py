import json
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/calendar.freebusy",
    "https://www.googleapis.com/auth/calendar.events",
]
CALENDAR_TIMEZONE = "Africa/Johannesburg"


def _calendar_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=ZoneInfo(CALENDAR_TIMEZONE))

    return value.astimezone(ZoneInfo(CALENDAR_TIMEZONE))


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
        "timeMin": _calendar_datetime(start_time).isoformat(),
        "timeMax": _calendar_datetime(end_time).isoformat(),
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
            "dateTime": _calendar_datetime(start_time).isoformat(),
            "timeZone": CALENDAR_TIMEZONE,
        },
        "end": {
            "dateTime": _calendar_datetime(end_time).isoformat(),
            "timeZone": CALENDAR_TIMEZONE,
        },
    }

    if location:
        event["location"] = location

    created_event = (
        service.events()
        .insert(
            calendarId=calendar_id,
            body=event,
            sendUpdates="none",
        )
        .execute()
    )

    return created_event


def update_calendar_event(
    event_id: str,
    summary: str,
    description: str | None,
    start_time: datetime,
    end_time: datetime,
    attendee_email: str | None = None,
    location: str | None = None,
):
    service = build_calendar_service()
    calendar_id = get_calendar_id()

    event = {
        "summary": summary,
        "description": description or "",
        "start": {
            "dateTime": _calendar_datetime(start_time).isoformat(),
            "timeZone": CALENDAR_TIMEZONE,
        },
        "end": {
            "dateTime": _calendar_datetime(end_time).isoformat(),
            "timeZone": CALENDAR_TIMEZONE,
        },
    }

    if location:
        event["location"] = location

    return (
        service.events()
        .update(
            calendarId=calendar_id,
            eventId=event_id,
            body=event,
            sendUpdates="none",
        )
        .execute()
    )


def delete_calendar_event(event_id: str):
    service = build_calendar_service()
    calendar_id = get_calendar_id()

    service.events().delete(
        calendarId=calendar_id,
        eventId=event_id,
        sendUpdates="all",
    ).execute()


def list_calendar_events():
    service = build_calendar_service()
    calendar_id = get_calendar_id()
    now = datetime.now(timezone.utc)

    response = (
        service.events()
        .list(
            calendarId=calendar_id,
            timeMin=now.isoformat(),
            timeMax=(now + timedelta(days=365)).isoformat(),
            singleEvents=True,
            orderBy="startTime",
            maxResults=250,
        )
        .execute()
    )

    return response.get("items", [])