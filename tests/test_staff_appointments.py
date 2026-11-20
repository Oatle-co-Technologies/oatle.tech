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
        self.data = dict(title='Project discussion', start_time=start, end_time=start+timedelta(minutes=30), notes='Project progress')

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
