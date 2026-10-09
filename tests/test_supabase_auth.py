import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from uuid import uuid4
import jwt
from fastapi import HTTPException
from backend.dependencies import get_current_staff

class SupabaseStaffTests(unittest.TestCase):
    def setUp(self):
        self.subject = uuid4()
        self.request = SimpleNamespace(headers={'Authorization':'Bearer token','x-oatle-auth-email':'info@oatle-technologies.co.za'},state=SimpleNamespace())
        self.db = Mock(); self.db.execute.return_value.scalar.return_value=3
        self.staff=SimpleNamespace(id=3,email='member@example.invalid',active=True,access_level='member')
        self.db.query.return_value.filter.return_value.first.return_value=self.staff
        self.env=patch.dict(os.environ,{'AUTH_PROVIDER':'supabase','SUPABASE_URL':'https://project.supabase.co'});self.env.start();self.addCleanup(self.env.stop)
        self.keys=patch('backend.dependencies.supabase_jwks_client');keys=self.keys.start();self.addCleanup(self.keys.stop)
        keys.return_value.get_signing_key_from_jwt.return_value=SimpleNamespace(key='key',algorithm_name='ES256')
        self.jwt_patch=patch('backend.dependencies.jwt.decode',return_value={'sub':str(self.subject)})
        self.decode=self.jwt_patch.start();self.addCleanup(self.jwt_patch.stop)

    def test_mapped_subject_and_strict_jwt_checks(self):
        self.assertIs(get_current_staff(self.request,self.db),self.staff)
        self.assertFalse(self.request.state.financial_owner)
        self.assertEqual(self.db.execute.call_args.args[1],{'subject':self.subject})
        kw=self.decode.call_args.kwargs
        self.assertEqual(kw['audience'],'authenticated');self.assertEqual(kw['issuer'],'https://project.supabase.co/auth/v1')
        self.assertEqual(kw['algorithms'],['ES256']);self.assertIn('exp',kw['options']['require'])

    def test_unmapped_subject_cannot_use_email_header(self):
        self.db.execute.return_value.scalar.return_value=None
        with self.assertRaises(HTTPException) as error:get_current_staff(self.request,self.db)
        self.assertEqual(error.exception.status_code,403);self.db.query.assert_not_called()

    def test_inactive_and_unsupported_roles_denied(self):
        for active,role in [(False,'admin'),(True,'visitor')]:
            self.staff.active=active;self.staff.access_level=role
            with self.assertRaises(HTTPException) as error:get_current_staff(self.request,self.db)
            self.assertEqual(error.exception.status_code,403)

    def test_invalid_expired_wrong_issuer_and_audience_denied(self):
        for kind in [jwt.InvalidSignatureError,jwt.ExpiredSignatureError,jwt.InvalidIssuerError,jwt.InvalidAudienceError]:
            self.decode.side_effect=kind()
            with self.assertRaises(HTTPException) as error:get_current_staff(self.request,self.db)
            self.assertEqual(error.exception.status_code,401)
        self.db.execute.assert_not_called()

    def test_mapped_financial_owner(self):
        self.staff.email='info@oatle-technologies.co.za';get_current_staff(self.request,self.db)
        self.assertTrue(self.request.state.financial_owner)

    def test_anonymous_users_denied(self):
        self.decode.return_value={'sub':str(self.subject),'is_anonymous':True}
        with self.assertRaises(HTTPException) as error:get_current_staff(self.request,self.db)
        self.assertEqual(error.exception.status_code,403);self.db.execute.assert_not_called()

class NeonHeaderTests(unittest.TestCase):
    @patch.dict(os.environ,{'AUTH_PROVIDER':'neon','NEON_AUTH_JWKS_URL':'https://auth.example/jwks'})
    @patch('backend.dependencies.PyJWKClient')
    @patch('backend.dependencies.jwt.decode')
    def test_header_cannot_grant_staff_identity(self,decode,keys):
        from test_auth_dependencies import FakeSession
        keys.return_value.get_signing_key_from_jwt.return_value=SimpleNamespace(key='key',algorithm_name='EdDSA')
        decode.return_value={'sub':str(uuid4())}
        staff=SimpleNamespace(auth_user_id=None,email='victim@example.invalid',active=True,access_level='admin')
        request=SimpleNamespace(headers={'Authorization':'Bearer token','x-oatle-auth-email':staff.email},state=SimpleNamespace())
        with self.assertRaises(HTTPException) as error:get_current_staff(request,FakeSession(staff))
        self.assertEqual(error.exception.status_code,403)
