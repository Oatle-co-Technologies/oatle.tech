from backend.main import app as backend_app


async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")

        if path == "/api/backend" or path.startswith("/api/backend/"):
            scope = dict(scope)

            new_path = path[len("/api/backend"):] or "/"

            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("utf-8")

    await backend_app(scope, receive, send)