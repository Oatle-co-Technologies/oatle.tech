import base64
import hashlib
import os
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.dependencies import get_current_staff, get_db
from backend.models.staff import Staff
from backend.services.task_notifications import todo_count

router = APIRouter(prefix="/task-notifications", tags=["Task notifications"])


class Subscription(BaseModel):
    endpoint: str = Field(max_length=2048)
    keys: dict[str, str]

    @field_validator("endpoint")
    @classmethod
    def validate_endpoint(cls, value):
        u = urlsplit(value)
        host = u.hostname or ""
        allowed = host in {"fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"} or host.endswith(".notify.windows.com")
        if u.scheme != "https" or not allowed or u.username or u.password or u.port not in (None, 443) or u.fragment:
            raise ValueError("Unsupported push service")
        return value

    @field_validator("keys")
    @classmethod
    def validate_keys(cls, value):
        for name, size in [("p256dh", 65), ("auth", 16)]:
            encoded = value.get(name, "")
            try:
                decoded = base64.b64decode(encoded + "=" * (-len(encoded) % 4), altchars=b"-_", validate=True)
            except Exception:
                raise ValueError("Invalid subscription key")
            if len(decoded) != size or (name == "p256dh" and decoded[0] != 4):
                raise ValueError("Invalid subscription key")
        return {name: value[name] for name in ("p256dh", "auth")}


@router.get("/summary")
def summary(db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    return {"staff_id": staff.id, "todo_count": todo_count(db, staff.id), "public_key": os.getenv("VAPID_PUBLIC_KEY", ""),
            "push_enabled": bool(os.getenv("VAPID_PRIVATE_KEY") and os.getenv("VAPID_PUBLIC_KEY"))}


@router.post("/subscription")
def subscribe(subscription: Subscription, db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    if not os.getenv("VAPID_PRIVATE_KEY") or not os.getenv("VAPID_PUBLIC_KEY"):
        raise HTTPException(503, "Task alerts are not configured yet")
    digest = hashlib.sha256(subscription.endpoint.encode()).hexdigest()
    # A subscription already owned by another account cannot be claimed.
    result = db.execute(text("""INSERT INTO public.staff_push_subscriptions
        (endpoint_hash,staff_id,endpoint,p256dh,auth) VALUES (:hash,:staff,:endpoint,:p256dh,:auth)
        ON CONFLICT (endpoint_hash) DO UPDATE SET p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth
        WHERE staff_push_subscriptions.staff_id=EXCLUDED.staff_id RETURNING staff_id"""),
        {"hash": digest, "staff": staff.id, "endpoint": subscription.endpoint, **subscription.keys}).scalar()
    if result is None:
        db.rollback()
        raise HTTPException(409, "This device subscription belongs to another account. Disable alerts and enable them again.")
    db.commit()
    return {"subscribed": True}


class Unsubscribe(BaseModel):
    endpoint: str = Field(max_length=2048)


@router.delete("/subscription")
def unsubscribe(subscription: Unsubscribe, db: Session = Depends(get_db), staff: Staff = Depends(get_current_staff)):
    db.execute(text("DELETE FROM public.staff_push_subscriptions WHERE endpoint_hash=:hash AND staff_id=:staff"),
               {"hash": hashlib.sha256(subscription.endpoint.encode()).hexdigest(), "staff": staff.id})
    db.commit()
    return {"subscribed": False}
