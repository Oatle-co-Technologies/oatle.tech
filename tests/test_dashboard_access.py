"""Dashboard summary access follows the verified staff role."""
import unittest
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api import dashboard
from backend.dependencies import get_current_staff


class Query:
    def filter(self, *args): return self
    def order_by(self, *args): return self
    def limit(self, *args): return self
    def scalar(self): return 0
    def all(self): return []


class Database:
    def __init__(self): self.calls = 0
    def query(self, *args):
        self.calls += 1
        return Query()


class DashboardAccessTests(unittest.TestCase):
    def summary(self, role):
        db = Database()
        app = FastAPI()
        app.include_router(dashboard.router)
        app.dependency_overrides[get_current_staff] = lambda: SimpleNamespace(id=27, access_level=role)
        app.dependency_overrides[dashboard.get_db] = lambda: db
        with TestClient(app) as client:
            response = client.get("/dashboard/summary")
        return response, db

    def test_member_cannot_read_business_overview(self):
        response, db = self.summary("member")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(db.calls, 0)

    def test_administrator_can_read_business_overview(self):
        response, db = self.summary("admin")
        self.assertEqual(response.status_code, 200)
        self.assertIn("active_clients", response.json())
        self.assertIn("lead_pipeline", response.json())
        self.assertGreater(db.calls, 0)
