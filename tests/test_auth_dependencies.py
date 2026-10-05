import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException

from backend.dependencies import get_current_staff
from backend.models.staff import Staff


class FakeQuery:
    def __init__(self, staff):
        self.staff = staff

    def filter(self, criterion):
        if self.staff is None:
            return self

        left = getattr(criterion, "left", None)
        field_name = getattr(left, "name", None)
        right = getattr(criterion, "right", None)
        value = getattr(right, "value", None)

        if field_name == "auth_user_id":
            if self.staff.auth_user_id != value:
                self.staff = None
        elif field_name == "email":
            if self.staff.email.lower() != str(value).lower():
                self.staff = None

        return self

    def first(self):
        return self.staff


class FakeSession:
    def __init__(self, staff):
        self.staff = staff

    def query(self, model):
        self.asserted_model = model
        return FakeQuery(self.staff)


class AuthDependenciesTests(unittest.TestCase):
    def setUp(self):
        self.user_id = uuid4()
        self.request = SimpleNamespace(
            state=SimpleNamespace(),
            headers={
                "Authorization": "Bearer verified-token",
                "x-oatle-auth-email": "employee@oatle-technologies.co.za",
            }
        )

    @patch.dict(
        "os.environ",
        {"NEON_AUTH_JWKS_URL": "https://auth.example/jwks"},
    )
    @patch("backend.dependencies.jwt.decode")
    @patch("backend.dependencies.PyJWKClient")
    def test_active_database_staff_member_is_authorized(
        self,
        jwks_client,
        decode,
    ):
        signing_key = SimpleNamespace(
            key="public-key",
            algorithm_name="EdDSA",
        )
        jwks_client.return_value.get_signing_key_from_jwt.return_value = (
            signing_key
        )
        decode.return_value = {"sub": str(self.user_id)}
        staff = SimpleNamespace(
            auth_user_id=None,
            email="employee@oatle-technologies.co.za",
            active=True,
            access_level="member",
        )

        result = get_current_staff(self.request, FakeSession(staff))

        self.assertIs(result, staff)

    @patch.dict(
        "os.environ",
        {"NEON_AUTH_JWKS_URL": "https://auth.example/jwks"},
    )
    @patch("backend.dependencies.jwt.decode")
    @patch("backend.dependencies.PyJWKClient")
    def test_verified_account_without_staff_record_is_rejected(
        self,
        jwks_client,
        decode,
    ):
        signing_key = SimpleNamespace(
            key="public-key",
            algorithm_name="EdDSA",
        )
        jwks_client.return_value.get_signing_key_from_jwt.return_value = (
            signing_key
        )
        decode.return_value = {"sub": str(self.user_id)}

        with self.assertRaises(HTTPException) as raised:
            get_current_staff(self.request, FakeSession(None))

        self.assertEqual(raised.exception.status_code, 403)

    @patch.dict(
        "os.environ",
        {"NEON_AUTH_JWKS_URL": "https://auth.example/jwks"},
    )
    @patch("backend.dependencies.jwt.decode")
    @patch("backend.dependencies.PyJWKClient")
    def test_inactive_staff_member_is_rejected(
        self,
        jwks_client,
        decode,
    ):
        signing_key = SimpleNamespace(
            key="public-key",
            algorithm_name="EdDSA",
        )
        jwks_client.return_value.get_signing_key_from_jwt.return_value = (
            signing_key
        )
        decode.return_value = {"sub": str(self.user_id)}
        staff = SimpleNamespace(
            auth_user_id=self.user_id,
            email="employee@oatle-technologies.co.za",
            active=False,
            access_level="member",
        )

        with self.assertRaises(HTTPException) as raised:
            get_current_staff(self.request, FakeSession(staff))

        self.assertEqual(raised.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
