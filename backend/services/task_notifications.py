import json
import logging
import os

from sqlalchemy import text
from backend.database.connection import SessionLocal
from backend.models.task import Task

logger = logging.getLogger(__name__)


def todo_count(db, staff_id):
    return db.query(Task).filter(Task.assigned_to == staff_id, Task.status == "todo").count()


def notify_task_counts(staff_ids):
    """Run after the task commit; failures must never roll back a saved task."""
    private_key = os.getenv("VAPID_PRIVATE_KEY", "")
    if not private_key:
        return
    from pywebpush import webpush, WebPushException
    with SessionLocal() as db:
        for staff_id in sorted(set(i for i in staff_ids if i is not None)):
            try:
                rows = db.execute(text("""SELECT p.endpoint_hash,p.endpoint,p.p256dh,p.auth
                    FROM public.staff_push_subscriptions p JOIN public.staff s ON s.id=p.staff_id
                    WHERE p.staff_id=:staff AND s.active=true AND s.access_level IN ('admin','member')"""),
                    {"staff": staff_id}).mappings().all()
                count = todo_count(db, staff_id)
                data = json.dumps({"todo_count": count, "staff_id": staff_id})
                for row in rows:
                    try:
                        webpush(subscription_info={"endpoint": row["endpoint"], "keys": {"p256dh": row["p256dh"], "auth": row["auth"]}},
                                data=data, vapid_private_key=private_key,
                                vapid_claims={"sub": "mailto:info@oatle-technologies.co.za"},
                                ttl=300, timeout=5)
                    except WebPushException as error:
                        if error.response is not None and error.response.status_code in (404, 410):
                            db.execute(text("DELETE FROM public.staff_push_subscriptions WHERE endpoint_hash=:hash"), {"hash": row["endpoint_hash"]})
                            db.commit()
                        else:
                            logger.warning("Task push delivery failed")
                    except Exception:
                        logger.warning("Task push delivery failed")
            except Exception:
                db.rollback()
                logger.warning("Task notification update failed")
