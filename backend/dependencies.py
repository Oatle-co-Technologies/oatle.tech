import os
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request
from jwt import PyJWKClient
from sqlalchemy.orm import Session
from sqlalchemy import text
from functools import lru_cache

from backend.database.connection import SessionLocal
from backend.models.staff import Staff

ALLOWED_ACCESS_LEVELS = {
    "admin",
    "member",
}


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@lru_cache(maxsize=4)
def supabase_jwks_client(url: str):
    return PyJWKClient(url, cache_keys=True)


def get_supabase_staff(token: str, request: Request, db: Session) -> Staff:
    base_url = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")).rstrip("/")
    if not base_url.startswith("https://"):
        raise HTTPException(status_code=500, detail="Authentication configuration is missing")
    try:
        key = supabase_jwks_client(base_url + "/auth/v1/.well-known/jwks.json").get_signing_key_from_jwt(token)
        if key.algorithm_name not in {"ES256", "RS256"}:
            raise jwt.InvalidTokenError("Unsupported signing algorithm")
        payload = jwt.decode(token, key.key, algorithms=[key.algorithm_name],
                             audience="authenticated", issuer=base_url + "/auth/v1",
                             options={"require": ["exp", "sub", "iss", "aud"]})
        subject = UUID(str(payload["sub"]))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication session")
    if payload.get("is_anonymous") is True:
        raise HTTPException(status_code=403, detail="Staff account required")
    staff_id = db.execute(text("SELECT staff_id FROM public.staff_supabase_identities WHERE auth_user_id = :subject"),
                          {"subject": subject}).scalar()
    staff = db.query(Staff).filter(Staff.id == staff_id).first() if staff_id is not None else None
    if not staff or not staff.active or staff.access_level not in ALLOWED_ACCESS_LEVELS:
        raise HTTPException(status_code=403, detail="No active staff record matched the verified account")
    request.state.financial_owner = staff.email.lower().strip() == "info@oatle-technologies.co.za"
    return staff


def get_current_staff(
    request: Request,
    db: Session = Depends(get_db),
) -> Staff:
    authorization = request.headers.get("Authorization", "").strip()

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication format",
        )

    token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token missing",
        )

    if os.getenv("AUTH_PROVIDER", "neon").lower() == "supabase":
        return get_supabase_staff(token, request, db)

    jwks_url = os.getenv("NEON_AUTH_JWKS_URL", "").strip()

    if not jwks_url:
        raise HTTPException(
            status_code=500,
            detail="Authentication configuration is missing",
        )

    try:
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=[signing_key.algorithm_name],
            options={
                "verify_aud": False,
            },
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Authentication session has expired",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Unable to verify authentication",
        )

    auth_user_id = payload.get("sub")
    token_email = payload.get("email", "")
    token_email = str(token_email).lower().strip()

    auth_user_uuid = None
    if auth_user_id:
        try:
            auth_user_uuid = UUID(str(auth_user_id))
        except ValueError:
            pass

    staff = None

    if auth_user_uuid:
        staff = (
            db.query(Staff)
            .filter(Staff.auth_user_id == auth_user_uuid)
            .first()
        )

    if not staff and token_email:
        staff = (
            db.query(Staff)
            .filter(Staff.email.ilike(token_email))
            .first()
        )

    if not staff:
        raise HTTPException(
            status_code=403,
            detail=(
                "No active staff record matched the verified account. "
                f"Subject present: {bool(auth_user_id)}; "
                f"Identity email present: {bool(token_email)}"
            ),
        )

    if (
        not staff.active
        or staff.access_level not in ALLOWED_ACCESS_LEVELS
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Staff record found, but it is inactive or has an "
                "unsupported access level"
            ),
        )

    # Resolve revenue access from verified identity, never the email header alone.
    request.state.financial_owner = (
        staff.email.lower().strip() == "info@oatle-technologies.co.za"
        and (
            (auth_user_uuid is not None and staff.auth_user_id == auth_user_uuid)
            or str(payload.get("email", "")).lower().strip()
            == "info@oatle-technologies.co.za"
        )
    )

    return staff


def get_admin_staff(
    staff: Staff = Depends(get_current_staff),
) -> Staff:
    if staff.access_level != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return staff


def is_financial_owner(request: Request) -> bool:
    return getattr(request.state, "financial_owner", False)
