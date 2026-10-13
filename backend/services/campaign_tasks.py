from sqlalchemy import and_, or_, func
from backend.models.task import Task


def campaign_task_filter():
    # Existing seeded assignments include preparation tasks without a campaign day.
    return and_(Task.task_type == "daily", or_(Task.campaign_day_id.is_not(None), func.coalesce(Task.setup_key, "").startswith("oct2026-")))
