"""Run against an isolated test connection; never import backend.main or use live credentials."""
import os
import importlib
import sys
from pathlib import Path
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["AUTH_PROVIDER"] = "neon"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
for model in ("client", "lead", "project", "task", "invoice", "pricing", "project_addon", "product_service", "staff", "appointment", "google_calendar", "product_product_service", "campaign_day"):
    importlib.import_module("backend.models." + model)
import pytest
raise SystemExit(pytest.main([str(Path(__file__).parent), "--ignore=" + str(Path(__file__).parent / "test_public_chat.py"), "-q", "--tb=short", "-p", "no:cacheprovider"]))
