from datetime import date, timedelta
from backend.models.campaign_day import CampaignDay
from backend.models.task import Task

CAMPAIGN = "October 2026 Demo Website Campaign"
INDUSTRIES = ["Mobile Beauty Studio", "Cleaning Services", "Daycare Services", "Event Planning & Décor Services"]


def seed_campaign(db, founder_id, kat_id, colin_id, created_by):
    """Only missing records are inserted; repeat setup never resets progress or edits."""
    counts = {"campaign_days_created": 0, "tasks_created": 0}
    days = {}
    for offset in range(12):
        focus = date(2026, 10, 12) + timedelta(days=offset)
        if focus.weekday() >= 5:
            continue
        industry = "Team onboarding & preparation" if offset == 0 else INDUSTRIES[offset - 1] if offset <= 4 else "Industry to be assigned"
        day = db.query(CampaignDay).filter(CampaignDay.focus_date == focus).first()
        if not day:
            day = CampaignDay(focus_date=focus, industry=industry, campaign_name=CAMPAIGN,
                              description="Review assignments and prepare the first week." if offset == 0 else "Static promotional flyers are the priority. Plumbing joins once technically ready." if offset <= 4 else "Founder to confirm the industry focus and assignments.")
            db.add(day)
            db.flush()
            counts["campaign_days_created"] += 1
        days[focus] = day

    def task(key, name, description, person, due, campaign=None):
        if db.query(Task).filter(Task.setup_key == key).first():
            return
        db.add(Task(setup_key=key, name=name, description=description, assigned_to=person,
                    created_by=created_by, due_date=due, campaign_day_id=campaign.id if campaign else None,
                    task_type="daily", status="todo", priority="medium"))
        db.flush()
        counts["tasks_created"] += 1

    for role, person in [("founder", founder_id), ("kat", kat_id), ("colin", colin_id)]:
        task("oct2026-onboarding-" + role, "Review campaign assignments and attend team onboarding",
             "Monday team meeting: confirm responsibilities, demo readiness, screenshot handoff and campaign dates.", person, date(2026, 10, 12), days[date(2026, 10, 12)])
    for index, industry in enumerate(INDUSTRIES):
        focus = date(2026, 10, 13) + timedelta(days=index)
        day = days[focus]
        # Previous working day delivery gives the founder time for flyer design.
        prior = focus - timedelta(days=1)
        while prior.weekday() >= 5:
            prior -= timedelta(days=1)
        key = "oct2026-" + str(index)
        task(key + "-screenshots", "Verify " + industry + " demo and supply screenshots",
             "Test desktop and mobile, fix technical issues, capture both screenshots and deliver to the founder. If assets are already ready, record their location and complete this once.", colin_id, prior, day)
        task(key + "-flyer", "Design " + industry + " promotional flyer",
             "Create one branded static image with desktop and mobile screenshots. Promote the demo and Oatle website development services. Deliver to Kat; no voiceover or video editing required. Prefer delivery ahead of campaign day.", founder_id, focus, day)
        suggestions = [
            ("research", "Research and qualify one promising business", "Identify at least one promising business in today's industry. Use professional judgment to qualify the opportunity."),
            ("outreach", "Contact a qualified prospect and share the demo", "Choose the professional channel and personalise the message independently. Escalate pricing, discounts, quotations and agreements to the founder."),
            ("publish", "Write a caption and publish the completed flyer", "Publish the founder's approved static promotional flyer with suitable social copy when it is ready."),
            ("leads", "Record outreach and follow-ups in Leads", "Use the existing Leads section to record prospect details, outreach and the next follow-up."),
            ("enquiries", "Respond to enquiries and follow up", "Manage ongoing communication and escalate qualified sales opportunities to the founder."),
        ]
        for suffix, name, description in suggestions:
            task(key + "-" + suffix, industry + ": " + name, description, kat_id, focus, day)
    task("oct2026-plumbing", "Complete and test the Plumbing Services demo",
         "Finish the demo, fix desktop/mobile issues and confirm technical readiness. Founder will then add Plumbing to the campaign schedule.", colin_id, date(2026, 10, 16))
    return counts
