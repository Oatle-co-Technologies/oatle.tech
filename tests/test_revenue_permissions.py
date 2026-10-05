import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient
from backend.dependencies import get_current_staff, is_financial_owner
from backend.api import dashboard
from test_auth_dependencies import FakeSession

# Register related models as the application does before invoice model tests.
from backend.models.product_service import ProductService  # noqa: F401
from backend.models.product_product_service import ProductProductService  # noqa: F401

OWNER = "info@oatle-technologies.co.za"


class FinancialPermissionsTests(unittest.TestCase):
    def authenticate(self, email=OWNER, role="admin", linked=True,
                     signed_email=None, header=OWNER):
        subject = uuid4()
        staff = SimpleNamespace(email=email, access_level=role, active=True,
                                auth_user_id=subject if linked else None)
        request = Request({"type": "http", "headers": [
            (b"authorization", b"Bearer verified-token"),
            (b"x-oatle-auth-email", header.encode()),
        ]})
        payload = {"sub": str(subject)}
        if signed_email:
            payload["email"] = signed_email
        with patch.dict("os.environ", {"NEON_AUTH_JWKS_URL": "https://auth.example/jwks"}), \
             patch("backend.dependencies.PyJWKClient") as jwks, \
             patch("backend.dependencies.jwt.decode", return_value=payload):
            jwks.return_value.get_signing_key_from_jwt.return_value = SimpleNamespace(
                key="public-key", algorithm_name="EdDSA")
            result = get_current_staff(request, FakeSession(staff))
        return request, result

    def test_linked_owner_and_signed_email_owner_allowed(self):
        for linked, signed in [(True, None), (False, OWNER)]:
            request, staff = self.authenticate(linked=linked, signed_email=signed)
            self.assertTrue(is_financial_owner(request))

    def test_member_and_other_admin_denied(self):
        for role in ["admin", "member"]:
            request, staff = self.authenticate(email="employee@example.com", role=role)
            self.assertFalse(is_financial_owner(request))

    def test_spoofed_owner_header_denied(self):
        request, staff = self.authenticate(linked=False, signed_email="employee@example.com")
        self.assertFalse(is_financial_owner(request))

    def test_summary_preserves_nonfinancial_fields_and_skips_revenue_query(self):
        class Query:
            def filter(self, *args): return self
            def order_by(self, *args): return self
            def limit(self, *args): return self
            def scalar(self): return 8500
            def all(self): return []
        class DB:
            def __init__(self): self.calls = []
            def query(self, *args):
                self.calls.append(args)
                return Query()
        summaries = []
        counts = []
        for owner in [True, False]:
            request = Request({"type": "http", "headers": []})
            request.state.financial_owner = owner
            db = DB()
            summaries.append(dashboard.get_dashboard_summary(
                request, db, SimpleNamespace(access_level="admin", id=1)))
            counts.append(len(db.calls))
        self.assertEqual(summaries[0].pop("revenue"), 8500.0)
        self.assertNotIn("revenue", summaries[1])
        self.assertEqual(summaries[0], summaries[1])
        self.assertEqual(counts[0], counts[1] + 1)
