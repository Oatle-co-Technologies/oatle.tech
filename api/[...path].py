from backend.main import app as backend_app


async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")

        if path.startswith("/api/"):
            scope = dict(scope)

            new_path = path[4:] or "/"

            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("utf-8")

    await backend_app(scope, receive, send)