# Public Cloudflare AI chat

The public chatbot uses Cloudflare Workers AI, with the fixed Free-plan model
`@cf/meta/llama-3.1-8b-instruct-fp8-fast`. It does not call OpenAI or fall back
onto a paid provider. Keep your Cloudflare account on Workers Free; the code
cannot control the account billing plan.

In Vercel's server environment variables, set for Production:

- `CLOUDFLARE_API_TOKEN`: Secret, the Workers AI token.
- `CLOUDFLARE_ACCOUNT_ID`: Config, the account ID from Cloudflare's REST API page.

Use the same settings in `backend/.env` for local Python development. Never use
a `NEXT_PUBLIC_` prefix or put the token in frontend code. Existing OpenAI
settings are unused by this endpoint and can be removed separately.

The route is `POST /api/chat`, accepting `{"message":"Hello"}` and returning
`{"reply":"..."}`. The homepage widget needs no provider-specific changes.

The implementation is `backend/api/chat.py`, registered only in the separate
`backend/chat_app.py`, exposed on Vercel by `api/chat.py`. There are no dashboard,
auth, database, tool, or private-record imports. Each question is independent.
Only the current message, public instructions and the full published pricing
guide are sent to Cloudflare. The guide is a static public snapshot in
`backend/api/pricing_knowledge.py`, extracted from `public/pricing-guide.pdf`.
Refresh that snapshot when the PDF changes; its source checksum is covered by
an offline test to catch stale pricing. No PDF parsing dependency is needed
in the deployed endpoint. Longer reference input uses more of the daily AI allowance.

Install `requirements.txt` and deploy the code after setting the variables.
For a standalone local server, run `python -m uvicorn backend.chat_app:app --port 8001`.
Next.js alone does not run Vercel Python functions locally.

The Free-plan AI allowance is shared across the account and resets daily.
If the provider returns a usage-limit error, the widget offers the contact page;
no paid fallback is attempted. Input is capped at 4,000 characters and output at
600 tokens. Deployment-level rate limiting should also protect the public route.

Offline verification: `python -m unittest discover -s tests -p test_public_chat.py`.
Tests replace environment loading and upstream requests; no secrets are read.
