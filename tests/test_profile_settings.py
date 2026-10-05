import unittest
from types import SimpleNamespace
from unittest.mock import Mock

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.auth import router
from backend.dependencies import get_current_staff, get_db


class ProfileSettingsTests(unittest.TestCase):
    def setUp(self):
        self.staff = SimpleNamespace(id=7, name="Old name", email="staff@example.com",
                                     access_level="member", active=True)
        self.other = SimpleNamespace(id=8, name="Other staff")
        self.db = Mock()
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.dependency_overrides[get_current_staff] = lambda: self.staff
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.client = TestClient(self.app)

    def test_saves_only_authenticated_staff_name_and_returns_saved_profile(self):
        response = self.client.patch("/auth/me", json={"name": "  New name  "})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "New name")
        self.assertEqual(self.staff.email, "staff@example.com")
        self.assertEqual(self.staff.access_level, "member")
        self.assertEqual(self.other.name, "Other staff")
        self.db.commit.assert_called_once()
        self.db.refresh.assert_called_once_with(self.staff)
        self.assertEqual(self.client.get("/auth/me").json()["name"], "New name")

    def test_rejects_empty_names_and_other_profile_fields(self):
        for body in [{"name": ""}, {"name": "   "}, {"name": None},
                     {"name": "New", "id": 8}, {"name": "New", "email": "other@example.com"},
                     {"name": "New", "access_level": "admin"}]:
            with self.subTest(body=body):
                self.assertEqual(self.client.patch("/auth/me", json=body).status_code, 422)
        self.db.commit.assert_not_called()
        self.assertEqual(self.staff.name, "Old name")

    def test_requires_authentication(self):
        del self.app.dependency_overrides[get_current_staff]
        self.assertEqual(self.client.patch("/auth/me", json={"name": "New"}).status_code, 401)
        self.db.commit.assert_not_called()


if __name__ == "__main__":
    unittest.main()
