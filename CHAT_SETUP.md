# Public AI chat

This project uses Next.js for the frontend and Python/FastAPI for the backend.
The endpoint implementation belongs in `backend/api/chat.py`, not `chat.js`
or `check.js`.

Existing internal routes are registered in `backend/main.py` and exposed by
`api/index.py`. Their `/api/backend/*` URLs pass through the authenticated
Next.js backend proxy. The public chatbot instead uses `backend/chat_app.py`
and the separate Vercel entry point `api/chat.py`. Do not register the chat
router in `backend/main.py` or add a public exception to the dashboard proxy.

Install Python dependencies from the project root:

```sh
python -m pip install -r requirements.txt
```

Keep the existing `OPENAI_API_KEY` in `backend/.env`. Also set
`OPENAI_CHAT_MODEL` to a Responses API model available to your OpenAI project.
No model is assumed; the endpoint returns 503 until both settings exist.
For Vercel, configure those server environment variables in the deployment;
a local ignored `.env` file is not uploaded. Do not use a `NEXT_PUBLIC_` prefix.

Local standalone server:

```sh
python -m uvicorn backend.chat_app:app --port 8001
```

The endpoint is `POST /api/chat` with JSON `{"message":"Hello"}` and returns
`{"reply":"..."}`. On Vercel the website can call `/api/chat` directly.
For local Next.js development, use a same-origin development proxy to port
8001, or test this standalone server directly. No frontend widget or proxy
has been added in this change.

Only the visitor's message and fixed public instructions are sent to OpenAI.
There are no database imports, tools, private data retrieval, or conversation
IDs. Requests accept a single message up to 4,000 characters; extra fields
are rejected. Output is limited to 600 tokens and response storage is disabled
via `store=False` (this is not a guarantee of zero provider retention).
The initial assistant has no verified company knowledge beyond its name.

Before public launch, configure deployment-level rate limiting for `/api/chat`
and an OpenAI project spending limit. This public route currently has input
and output bounds, but no cross-request abuse protection. A separate app
isolates code and routing; the deployment still shares its server environment.
