"""Vercel entry point for /api/chat, separate from the internal backend."""

import sys
from pathlib import Path

project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.chat_app import app  # noqa: E402, F401
