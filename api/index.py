"""
Vercel serverless function entrypoint for the Oatle Technologies API.

Vercel only auto-discovers Python functions from a root-level `api/`
directory, so this file exposes the existing FastAPI application from
`backend/main.py`. No backend logic lives here and nothing is duplicated.

Production requests arrive under the `/api/backend` prefix (for example
`/api/backend/dashboard/summary`), while the FastAPI routes are defined
without that prefix (`/dashboard/summary`, `/clients/`, ...). Requests
first pass through a Next.js route handler, which obtains a Neon JWT from
the server-side session and forwards the target path in a private routing
header. The ASGI wrapper below uses that path before passing the request
to the existing app, preserving the public `/api/backend/*` URL structure.

Trailing-slash handling: Vercel's rewrite engine cannot match
`/api/backend/:path*` against URLs that END with a slash, so Vercel's
default trailing-slash normalization (a 308 that preserves method and
body) delivers e.g. `/api/backend/clients/` as `/api/backend/clients`.
After stripping the prefix, this wrapper snaps the remaining path onto
the routes actually registered on the FastAPI app (adding or removing a
trailing slash when exactly that variant is registered). Collection
routes such as `/clients/`, `/leads/`, `/projects/`, `/tasks/`,
`/staff/` and `/invoices/` therefore resolve within a single function
invocation: Starlette's redirect_slashes never fires and no redirect can
escape the /api/backend/* namespace.
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
BACKEND_PATH_HEADER = b"x-oatle-backend-path"

_route_paths = None


def _registered_route_paths():
    """Exact paths registered on the FastAPI app (computed once)."""
    global _route_paths

    if _route_paths is None:
        paths = set()

        for route in getattr(backend_app, "routes", []):
            route_path = getattr(route, "path", None)

            if isinstance(route_path, str):
                paths.add(route_path)

        _route_paths = paths

    return _route_paths


async def app(scope, receive, send):
    """
    ASGI wrapper that removes the /api/backend prefix before the
    request reaches the existing FastAPI application, then snaps the
    stripped path onto a registered route when only a trailing slash
    differs.
    """
    if scope["type"] == "http":
        path = scope.get("path", "")
        headers = dict(scope.get("headers", []))
        forwarded_path = headers.get(BACKEND_PATH_HEADER)

        if forwarded_path:
            new_path = forwarded_path.decode("utf-8")
        elif path == API_PREFIX or path.startswith(API_PREFIX + "/"):
            new_path = path[len(API_PREFIX):] or "/"
        else:
            new_path = None

        if new_path:
            if not new_path.startswith("/"):
                new_path = "/" + new_path

            route_paths = _registered_route_paths()

            if new_path not in route_paths:
                without_slash = new_path.rstrip("/") or "/"

                if without_slash + "/" in route_paths:
                    new_path = without_slash + "/"
                elif without_slash in route_paths:
                    new_path = without_slash

            scope = dict(scope)

            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("utf-8")

    await backend_app(scope, receive, send)
