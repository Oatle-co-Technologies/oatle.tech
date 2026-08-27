import os
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.staff import Staff


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


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
            algorithms=["RS256", "ES256"],
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

    if not auth_user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication identity is missing",
        )

    try:
        auth_user_uuid = UUID(str(auth_user_id))
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication identity",
        )

    staff = (
        db.query(Staff)
        .filter(Staff.auth_user_id == auth_user_uuid)
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this dashboard",
        )

    if not staff.active:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this dashboard",
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