"""Offline checks; never load real secrets or call a provider."""
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch
import httpx
from fastapi.testclient import TestClient

with patch("dotenv.load_dotenv"):
    from backend.chat_app import app

class PublicChatTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)
        self.client = TestClient(app)

    def configure(self):
        os.environ.update(CLOUDFLARE_API_TOKEN="test-placeholder", CLOUDFLARE_ACCOUNT_ID="a" * 32)

    def request_with(self, upstream):
        self.configure()
        context = AsyncMock()
        context.__aenter__.return_value.post = AsyncMock(return_value=upstream)
        with patch("backend.api.chat.httpx.AsyncClient", return_value=context):
            response = self.client.post("/api/chat", json={"message": " Hello "})
        return response, context.__aenter__.return_value.post.call_args

    def test_isolation(self):
        from backend.api.chat import router
        self.assertEqual({r.path for r in router.routes}, {"/api/chat"})
        self.assertNotIn("backend.main", sys.modules)
        self.assertNotIn("backend.database.connection", sys.modules)
        self.assertEqual(self.client.get("/dashboard/summary").status_code, 404)

    def test_missing_configuration_and_no_openai_fallback(self):
        os.environ.update(OPENAI_API_KEY="unused", OPENAI_CHAT_MODEL="unused")
        self.assertEqual(self.client.post("/api/chat", json={"message":"Hello"}).status_code, 503)

    def test_invalid_account_id(self):
        self.configure()
        os.environ["CLOUDFLARE_ACCOUNT_ID"] = "invalid/account"
        self.assertEqual(self.client.post("/api/chat", json={"message":"Hello"}).status_code, 503)

    def test_validation(self):
        for body in ({"message":" "}, {"message":"x"*4001}, {"message":"Hello","tools":[]}):
            self.assertEqual(self.client.post("/api/chat", json=body).status_code, 422)

    def test_public_request_and_reply(self):
        response, call = self.request_with(httpx.Response(200, json={"success":True,"result":{"response":"Hello visitor"}}))
        self.assertEqual(response.json(), {"reply":"Hello visitor"})
        self.assertTrue(call.args[0].startswith("https://api.cloudflare.com/"))
        self.assertEqual(call.kwargs["json"]["messages"][-1], {"role":"user","content":"Hello"})
        self.assertEqual(len(call.kwargs["json"]["messages"]), 2)
        self.assertEqual(call.kwargs["json"]["max_tokens"], 600)
        self.assertNotIn("tools", call.kwargs["json"])

    def test_rate_limit(self):
        response, _ = self.request_with(httpx.Response(429, json={"errors":[{"message":"private details"}]}))
        self.assertEqual(response.status_code, 429)
        self.assertNotIn("private details", response.text)

    def test_provider_errors_are_private(self):
        for upstream in (httpx.Response(401, text="private details"),
                         httpx.Response(200, json={"success":False,"errors":["private details"]}),
                         httpx.Response(200, json=[]), httpx.Response(200, text="invalid json")):
            response, _ = self.request_with(upstream)
            self.assertEqual(response.status_code, 502)
            self.assertNotIn("private details", response.text)

    def test_connection_error_is_private(self):
        self.configure()
        context=AsyncMock()
        context.__aenter__.return_value.post.side_effect=httpx.ConnectError("private details")
        with patch("backend.api.chat.httpx.AsyncClient", return_value=context):
            response=self.client.post("/api/chat", json={"message":"Hello"})
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private details", response.text)

if __name__ == "__main__":
    unittest.main()
