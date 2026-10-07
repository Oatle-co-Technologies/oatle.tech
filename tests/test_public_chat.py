"""Offline checks: no real environment file or OpenAI request is used."""

import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

with patch("dotenv.load_dotenv"):
    from backend.chat_app import app


class PublicChatTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {}, clear=True)
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.client = TestClient(app)

    def test_chat_isolated_from_internal_routes_and_imports(self):
        from backend.api.chat import router
        self.assertEqual({route.path for route in router.routes}, {"/api/chat"})
        self.assertNotIn("backend.main", sys.modules)
        self.assertNotIn("backend.database.connection", sys.modules)
        self.assertEqual(self.client.get("/dashboard/summary").status_code, 404)

    def test_unconfigured_chat_returns_safe_error(self):
        response = self.client.post("/api/chat", json={"message": "Hello"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"detail": "Chat is not configured yet"})

    def test_invalid_messages_and_extra_fields_rejected(self):
        for body in ({"message": "  "}, {"message": "x" * 4001},
                     {"message": "Hello", "tools": []}):
            with self.subTest(body_size=len(str(body))):
                self.assertEqual(self.client.post("/api/chat", json=body).status_code, 422)

    def test_only_public_message_sent_and_reply_returned(self):
        os.environ.update(OPENAI_API_KEY="test-placeholder", OPENAI_CHAT_MODEL="test-model")
        upstream = SimpleNamespace(responses=SimpleNamespace(
            create=AsyncMock(return_value=SimpleNamespace(output_text="Hello visitor"))))
        context = AsyncMock()
        context.__aenter__.return_value = upstream
        with patch("backend.api.chat.AsyncOpenAI", return_value=context):
            response = self.client.post("/api/chat", json={"message": " Hello "})
        self.assertEqual(response.json(), {"reply": "Hello visitor"})
        kwargs = upstream.responses.create.call_args.kwargs
        self.assertEqual(kwargs["input"], [{"role": "user", "content": "Hello"}])
        self.assertFalse(kwargs["store"])
        self.assertNotIn("tools", kwargs)
        self.assertNotIn("previous_response_id", kwargs)

    def test_vercel_secret_alias_is_supported(self):
        os.environ.update(AI_API_KEY="test-placeholder", OPENAI_CHAT_MODEL="test-model")
        context = AsyncMock()
        context.__aenter__.return_value = SimpleNamespace(responses=SimpleNamespace(
            create=AsyncMock(return_value=SimpleNamespace(output_text="Hello"))))
        with patch("backend.api.chat.AsyncOpenAI", return_value=context) as factory:
            response = self.client.post("/api/chat", json={"message": "Hello"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(factory.call_args.kwargs["api_key"], "test-placeholder")

    def test_provider_errors_do_not_leak_details(self):
        from openai import APIConnectionError
        import httpx

        os.environ.update(OPENAI_API_KEY="test-placeholder", OPENAI_CHAT_MODEL="test-model")
        context = AsyncMock()
        context.__aenter__.side_effect = APIConnectionError(
            message="private upstream details", request=httpx.Request("POST", "https://example.com"))
        with patch("backend.api.chat.AsyncOpenAI", return_value=context):
            response = self.client.post("/api/chat", json={"message": "Hello"})
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private upstream", response.text)


if __name__ == "__main__":
    unittest.main()
