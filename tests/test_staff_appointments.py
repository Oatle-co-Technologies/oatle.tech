import inspect
import unittest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from zoneinfo import ZoneInfo
from fastapi import HTTPException
from pydantic import ValidationError
from backend.api.appointments import book_staff_appointment
from backend.dependencies import get_current_staff
from backend.schemas.appointment import StaffAppointmentCreate

class StaffBookingTests(unittest.TestCase):
    def setUp(self):
        self.staff = Mock(id=7, email='staff@example.test', active=True, access_level='member')
        self.staff.name = 'Test staff'
        self.owner = Mock(id=1, active=True, access_level='admin')
        self.db = Mock()
        self.db.query.return_value.filter.return_value.first.return_value = self.owner
        start = datetime.now(ZoneInfo('Africa/Johannesburg')) + timedelta(days=2)
        self.data = dict(title='Project discussion', start_time=start, end_time=start+timedelta(minutes=30), notes='Project progress', meeting_link='https://meet.google.com/test-room')

    def test_requires_verified_current_staff(self):
        self.assertIs(inspect.signature(book_staff_appointment).parameters['staff'].default.dependency, get_current_staff)

    def test_binds_owner_and_signed_in_staff_not_client_supplied_identity(self):
        with patch('backend.api.appointments.create_appointment', return_value='confirmed') as create:
            result = book_staff_appointment(StaffAppointmentCreate(**self.data), self.db, self.staff)
        self.assertEqual(result, 'confirmed')
        appointment = create.call_args.args[0]
        self.assertEqual(appointment.organizer_staff_id, 1)
        self.assertEqual(appointment.participant_staff_id, 7)
        self.assertEqual(appointment.participant_email, 'staff@example.test')
        self.assertEqual(appointment.participant_name, 'Test staff')
        self.assertEqual(appointment.appointment_type, 'staff_meeting')
        self.assertEqual(appointment.location, 'https://meet.google.com/test-room')
        self.assertEqual(appointment.start_time.hour, self.data['start_time'].hour)
        for key in ['organizer_staff_id', 'participant_staff_id', 'participant_email', 'appointment_type']:
            with self.assertRaises(ValidationError):
                StaffAppointmentCreate(**self.data, **{key: 99 if key.endswith('_id') else 'spoof'})

    def test_invalid_or_past_times_never_call_calendar(self):
        with patch('backend.api.appointments.create_appointment') as create:
            for changes in [dict(start_time=datetime(2020,1,1)), dict(end_time=self.data['start_time']), dict(end_time=self.data['start_time']+timedelta(hours=3))]:
                with self.assertRaises(HTTPException) as raised:
                    book_staff_appointment(StaffAppointmentCreate(**{**self.data, **changes}), self.db, self.staff)
                self.assertEqual(raised.exception.status_code,400)
            create.assert_not_called()

    def test_missing_or_inactive_owner_blocks_booking(self):
        for owner in [None, Mock(active=False), Mock(active=True, access_level='member')]:
            self.db.query.return_value.filter.return_value.first.return_value = owner
            with patch('backend.api.appointments.create_appointment') as create:
                with self.assertRaises(HTTPException) as raised:
                    book_staff_appointment(StaffAppointmentCreate(**self.data), self.db, self.staff)
                self.assertEqual(raised.exception.status_code,503)
                create.assert_not_called()

    def test_meeting_link_rejects_non_web_links(self):
        with self.assertRaises(ValidationError):
            StaffAppointmentCreate(**{**self.data, 'meeting_link': 'javascript:alert(1)'})

    def test_owner_creation_rejects_past_start_before_calendar_access(self):
        from backend.api.appointments import create_appointment
        from backend.schemas.appointment import AppointmentCreate
        data = AppointmentCreate(participant_name='Test', participant_email='test@example.test', title='Past booking', start_time=datetime(2020,1,1), end_time=datetime(2020,1,1,1))
        with patch('backend.api.appointments.get_free_busy') as busy:
            with self.assertRaises(HTTPException) as raised:
                create_appointment(data, self.db, self.staff)
            self.assertEqual(raised.exception.status_code,400)
            busy.assert_not_called()

class StaffAppointmentManagementTests(unittest.TestCase):
    def setUp(self):
        from types import SimpleNamespace
        self.request = SimpleNamespace(state=SimpleNamespace(financial_owner=False))
        self.staff = SimpleNamespace(id=7, access_level='member')
        start = datetime.now(ZoneInfo('Africa/Johannesburg')).replace(tzinfo=None) + timedelta(days=2)
        self.record = SimpleNamespace(id=1, appointment_type='staff_meeting', participant_staff_id=7, participant_name='Test staff', participant_email='staff@example.test', title='Meeting', notes='', location=None, google_event_id='test-event', start_time=start, end_time=start+timedelta(minutes=30), status='confirmed')
        self.db = Mock()

    def test_own_edit_updates_existing_google_event(self):
        from backend.api.appointments import update_appointment
        from backend.schemas.appointment import AppointmentUpdate
        self.db.query.return_value.filter.return_value.first.side_effect=[self.record,None]
        with patch('backend.api.appointments.update_calendar_event') as calendar:
            update_appointment(1,AppointmentUpdate(title='Updated subject',location='https://meet.google.com/test-room'),self.request,self.db,self.staff)
        self.assertEqual(self.record.title,'Updated subject')
        self.assertEqual(calendar.call_args.kwargs['event_id'],'test-event')
        self.assertEqual(calendar.call_args.kwargs['location'],'https://meet.google.com/test-room')
        self.db.commit.assert_called_once()

    def test_other_staff_or_imported_appointments_cannot_be_edited_or_deleted(self):
        from backend.api.appointments import update_appointment,delete_appointment
        from backend.schemas.appointment import AppointmentUpdate
        for kind,participant in [('staff_meeting',8),('google_calendar',7)]:
            self.record.appointment_type=kind;self.record.participant_staff_id=participant
            self.db.query.return_value.filter.return_value.first.return_value=self.record
            with patch('backend.api.appointments.update_calendar_event') as update,patch('backend.api.appointments.delete_calendar_event') as delete:
                for action in [lambda:update_appointment(1,AppointmentUpdate(title='Attempt'),self.request,self.db,self.staff),lambda:delete_appointment(1,self.request,self.db,self.staff)]:
                    with self.assertRaises(HTTPException) as raised:action()
                    self.assertEqual(raised.exception.status_code,403)
                update.assert_not_called();delete.assert_not_called()
        self.db.delete.assert_not_called();self.db.commit.assert_not_called()

    def test_staff_cannot_change_identity_or_status_on_own_booking(self):
        from backend.api.appointments import update_appointment
        from backend.schemas.appointment import AppointmentUpdate
        self.db.query.return_value.filter.return_value.first.return_value=self.record
        for change in [dict(participant_email='other@example.test'),dict(status='cancelled')]:
            with self.assertRaises(HTTPException) as raised:
                update_appointment(1,AppointmentUpdate(**change),self.request,self.db,self.staff)
            self.assertEqual(raised.exception.status_code,403)

    def test_delete_own_booking_removes_its_google_event(self):
        from backend.api.appointments import delete_appointment
        self.db.query.return_value.filter.return_value.first.return_value=self.record
        with patch('backend.api.appointments.delete_calendar_event') as calendar:
            delete_appointment(1,self.request,self.db,self.staff)
        calendar.assert_called_once_with('test-event')
        self.db.delete.assert_called_once_with(self.record)
        self.db.commit.assert_called_once()

    def test_owner_retains_management_of_other_appointments(self):
        from backend.api.appointments import delete_appointment
        self.staff.access_level='admin';self.request.state.financial_owner=True
        self.record.participant_staff_id=8;self.record.appointment_type='general'
        self.db.query.return_value.filter.return_value.first.return_value=self.record
        with patch('backend.api.appointments.delete_calendar_event') as calendar:
            delete_appointment(1,self.request,self.db,self.staff)
        calendar.assert_called_once_with('test-event')
