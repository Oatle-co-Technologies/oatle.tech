from backend.main import app as backend_app


async def app(scope, receive, send):
    if scope["type"] != "http":
        await backend_app(scope, receive, send)
        return

    path = scope.get("path", "")

    if path == "/api/backend" or path.startswith("/api/backend/"):
        scope = dict(scope)

        new_path = path[len("/api/backend"):] or "/"

        scope["path"] = new_path
        scope["raw_path"] = new_path.encode("utf-8")

        await backend_app(scope, receive, send)
        return

    await send({
        "type": "http.response.start",
        "status": 404,
        "headers": [
            (b"content-type", b"text/plain; charset=utf-8")
        ],
    })

    await send({
        "type": "http.response.body",
        "body": b"Not Found",
    })