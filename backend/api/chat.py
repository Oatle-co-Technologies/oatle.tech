"""Public marketing chat. No database, dashboard, or auth dependencies."""

import os
import re

import httpx

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter(tags=["Public chat"])

INSTRUCTIONS = """You are the public website assistant for Oatle Technologies.
Help visitors with general website and technology enquiries. You have no access
to internal dashboards, clients, invoices, staff, calendars, or authenticated
data. Never claim to retrieve private records or perform internal actions.
Do not invent prices, company policies, contact details, or service commitments.
For company-specific facts you cannot confirm, direct visitors to the website's
contact page. Keep answers brief and friendly.
"""


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=4000)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be blank")
        return value


class ChatResponse(BaseModel):
    reply: str


# Fixed to a model available on Workers AI Free; no paid-provider fallback.
MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8-fast"


@router.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
    if not token or not re.fullmatch(r"[a-fA-F0-9]{32}", account_id):
        raise HTTPException(503, "Chat is not configured yet")

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{MODEL}"
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "messages": [
                        {"role": "system", "content": INSTRUCTIONS},
                        {"role": "user", "content": payload.message},
                    ],
                    "max_tokens": 600,
                },
            )
        if response.status_code == 429:
            raise HTTPException(429, "Chat has reached its usage limit. Please contact our team")
        if not response.is_success:
            raise HTTPException(502, "Chat is temporarily unavailable")
        data = response.json()
        result = data.get("result") if isinstance(data, dict) else None
        reply = result.get("response") if isinstance(result, dict) else None
        if not isinstance(data, dict) or data.get("success") is not True or not isinstance(reply, str) or not reply.strip():
            raise HTTPException(502, "Chat could not generate a reply")
        return ChatResponse(reply=reply.strip())
    except (httpx.HTTPError, ValueError):
        # Never return provider details, headers, or credentials.
        raise HTTPException(502, "Chat is temporarily unavailable") from None
