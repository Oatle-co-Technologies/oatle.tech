"""
Vercel serverless function entrypoint for the Oatle Technologies API.

Vercel only auto-discovers Python functions from a root-level `api/`
directory, so this file exposes the existing FastAPI application from
`backend/main.py`. No backend logic lives here and nothing is duplicated.

Production requests arrive under the `/api/backend` prefix (for example
`/api/backend/dashboard/summary`), while the FastAPI routes are defined
without that prefix (`/dashboard/summary`, `/clients/`, ...). The ASGI
wrapper below strips the prefix before passing the request to the
existing app, preserving the public `/api/backend/*` URL structure.
"""

import os
import sys

# Ensure the project root is importable so `backend.*` modules resolve
# when Vercel invokes this function from the api/ directory.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.main import app as backend_app  # noqa: E402

API_PREFIX = "/api/backend"


async def app(scope, receive, send):
    """
    ASGI wrapper that removes the /api/backend prefix before the
    request reaches the existing FastAPI application.
    """
    if scope["type"] == "http":
        path = scope.get("path", "")

        if path == API_PREFIX or path.startswith(API_PREFIX + "/"):
            scope = dict(scope)

            new_path = path[len(API_PREFIX):] or "/"

            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("utf-8")

    await backend_app(scope, receive, send)