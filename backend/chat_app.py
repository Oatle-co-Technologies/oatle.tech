"""Standalone public chat application; intentionally does not import main."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv(Path(__file__).resolve().parent / ".env", override=False)

from backend.api.chat import router  # noqa: E402

app = FastAPI(title="Oatle public chat", docs_url=None, redoc_url=None,
              openapi_url=None)
app.include_router(router)
