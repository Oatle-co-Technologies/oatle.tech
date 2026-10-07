"""Public marketing chat. No database, dashboard, or auth dependencies."""

import os

from fastapi import APIRouter, HTTPException
from openai import APIError, AsyncOpenAI, RateLimitError
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


@router.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    model = os.getenv("OPENAI_CHAT_MODEL", "").strip()
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("AI_API_KEY")
    if not api_key or not model:
        raise HTTPException(503, "Chat is not configured yet")

    try:
        async with AsyncOpenAI(api_key=api_key, timeout=25.0, max_retries=0) as client:
            response = await client.responses.create(
                model=model,
                instructions=INSTRUCTIONS,
                input=[{"role": "user", "content": payload.message}],
                max_output_tokens=600,
                store=False,
            )
        if not response.output_text:
            raise HTTPException(502, "Chat could not generate a reply")
        return ChatResponse(reply=response.output_text)
    except RateLimitError:
        raise HTTPException(429, "Chat is busy. Please try again later") from None
    except APIError:
        # Provider errors may include request details: never return them.
        raise HTTPException(502, "Chat is temporarily unavailable") from None
