import unittest
from datetime import datetime
from unittest.mock import Mock, patch

from backend.api.appointments import get_appointments
from backend.integrations.google_calendar import appointment_datetime, calendar_event_location, update_calendar_event
from backend.schemas.appointment import AppointmentResponse


class CalendarSyncTests(unittest.TestCase):
    def event(self):
        return {"id": "event-test", "summary": "Test meeting",
                "start": {"dateTime": "2026-10-12T08:00:00Z"},
                "end": {"dateTime": "2026-10-12T09:00:00Z"},
                "hangoutLink": "https://meet.google.com/abc-defg-hij"}

    def test_utc_and_offset_times_store_same_south_african_wall_time(self):
        for text in ["2026-10-12T08:00:00Z", "2026-10-12T10:00:00+02:00", "2026-10-12T10:00:00"]:
            self.assertEqual(appointment_datetime(datetime.fromisoformat(text)), datetime(2026, 10, 12, 10))

    def test_imports_meet_link_and_emits_explicit_timezone(self):
        db = Mock(); db.query.return_value.filter.return_value.first.return_value = None
        db.query.return_value.order_by.return_value.all.return_value = []
        with patch('backend.api.appointments.list_calendar_events', return_value=[self.event()]):
            get_appointments(db)
        appointment = db.add.call_args.args[0]
        self.assertEqual(appointment.start_time.hour, 10)
        self.assertEqual(appointment.location, self.event()['hangoutLink'])
        appointment.id = 1; appointment.status = 'confirmed'
        appointment.created_at = appointment.updated_at = datetime(2026, 10, 9)
        response = AppointmentResponse.model_validate(appointment).model_dump(mode='json')
        self.assertEqual(response['start_time'], '2026-10-12T10:00:00+02:00')

    def test_refresh_repairs_existing_import_without_duplicate(self):
        existing = Mock(); existing.start_time = datetime(2026, 10, 12, 8); existing.location = None
        db = Mock(); db.query.return_value.filter.return_value.first.return_value = existing
        with patch('backend.api.appointments.list_calendar_events', return_value=[self.event()]):
            get_appointments(db); get_appointments(db)
        self.assertEqual(existing.start_time, datetime(2026, 10, 12, 10))
        self.assertEqual(existing.location, self.event()['hangoutLink'])
        db.add.assert_not_called()

    def test_conference_video_fallback_and_physical_location(self):
        self.assertEqual(calendar_event_location({'conferenceData': {'entryPoints': [
            {'entryPointType': 'phone', 'uri': 'tel:123'}, {'entryPointType': 'video', 'uri': 'https://meet.google.com/test'}]}}), 'https://meet.google.com/test')
        self.assertEqual(calendar_event_location({'location': 'Office'}), 'Office')

    def test_edit_patches_event_without_replacing_conference_or_guests(self):
        service = Mock()
        with patch('backend.integrations.google_calendar.build_calendar_service', return_value=service), patch('backend.integrations.google_calendar.get_calendar_id', return_value='test-calendar'):
            update_calendar_event('event-test', 'Test meeting', None, datetime(2026, 10, 12, 10), datetime(2026, 10, 12, 11))
        body = service.events.return_value.patch.call_args.kwargs['body']
        self.assertEqual(body['start']['dateTime'], '2026-10-12T10:00:00+02:00')
        self.assertNotIn('conferenceData', body); self.assertNotIn('attendees', body)
        service.events.return_value.update.assert_not_called()
