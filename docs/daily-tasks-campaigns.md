# Daily Tasks & Campaign Schedule

Adds `/dashboard/daily-tasks` (My Tasks / Team Tasks) and `/dashboard/campaign-schedule` to the existing PWA. Uses the existing backend proxy, authentication, staff records and PostgreSQL tasks table. No new dependencies or media tools are introduced.

## Release and setup

1. Review and approve the production release and database migration separately. No production operations were performed during implementation.
2. Apply `backend/migrations/20261010_daily_tasks_campaigns.sql` using the existing privileged database migration connection **before releasing the new backend**. The migration is additive and can be rerun. Existing task columns and records are retained; the new campaign table is unavailable to direct anon/authenticated database access. FastAPI enforces access through the existing authentication layer.
3. Release frontend/backend together after approval. Existing task APIs and owner-only controls remain; new Daily Tasks administration follows the requested admin role policy.
4. Sign in as the founder. Open Campaign Schedule → Set up initial campaign. Select the existing founder, Kat and Colin users. This creates only missing records and never resets progress, changes existing assignees or overwrites edited campaign days. A transaction lock and unique setup keys protect concurrent/repeated runs.
5. Review assignments, confirm Monday's meeting details in the existing appointments section, and set the second week's industry focus as needed. Plumbing has a readiness task but no fixed campaign day until its demo is complete.

## Initial plan

- 12 October 2026: onboarding and assignment review for all three people.
- 13 October: Mobile Beauty Studio.
- 14 October: Cleaning Services.
- 15 October: Daycare Services.
- 16 October: Event Planning & Décor Services.
- 19–23 October: editable placeholders pending founder decisions.

Setup creates 10 campaign days and 32 tasks: 3 onboarding, 4 founder flyer tasks, 4 Colin verification/screenshot handoffs, 20 Kat suggested outreach/publication/Leads/follow-up assignments, and 1 Plumbing readiness task. Screenshot tasks are due on the previous working day and are created once per demo, not repeatedly each day. Flyer deadlines are the campaign dates, with early delivery encouraged. Video tasks can be added manually when required.

## Behaviour and permissions

My Tasks includes the founder's own assignments, overdue/undated unfinished tasks, upcoming work and completed history. Daily Tasks also displays existing project/service assignments, keeping a single task source. Status changes save immediately; notes save on leaving the field or selecting Save notes. Notes are plain text and may contain asset locations; files remain in the team's existing external tools.

Only administrators may create, edit assignments, duplicate/delete tasks or edit the campaign schedule. Staff can retrieve their own assignments and patch only status/notes; requesting team mode still returns only their own records. Progress inputs reject extra fields, invalid statuses and null statuses. Legacy edits of new `daily` task records are directed to Daily Tasks and rejected by the old backend edit path. Existing Leads, Clients, invoices/revenue and authentication logic are unchanged.

Completion writes a UTC `completed_at` timestamp; note edits retain it. Reopening clears it. Date-only deadlines stay calendar dates; the browser computes today's date and renders timestamps in Africa/Johannesburg. Routine setup uses weekdays; manual campaign dates can include weekends. No automatic completion, reassignment or removal takes place.

## Validation

- 56 Python tests plus 10 existing subtests passed across the database/auth/permissions/task/calendar/invoice suites and the separately isolated public-chat suite.
- 16 JavaScript tests passed, including Johannesburg date rollover, date-only week grouping and UTC completion rendering.
- TypeScript and scoped ESLint checks passed.
- Browser checks at 390px and 1440px used test identities and mocked API responses: My/Team views, self-assignment, filters, progress notes, completing/reopening, campaign editing and staff-only controls. No horizontal overflow or browser exceptions remained. Actual authenticated deployment smoke testing is pending release approval.
- A temporary PostgreSQL instance was populated from the original schema. The migration was applied twice; an original task remained intact. The authenticated setup endpoint was run twice: first run added 10 days/32 tasks, second run added zero. This instance had no production credentials or data.

The Python regression runner uses `DATABASE_URL=sqlite://` and does not import the application startup that creates tables. The public-chat isolation suite must be run separately because it asserts the database module was never imported. Run from the repository root:

```
PYTHONDONTWRITEBYTECODE=1 python tests/run_backend_regression.py
PYTHONDONTWRITEBYTECODE=1 DATABASE_URL=sqlite:// python -m pytest tests/test_public_chat.py -q -p no:cacheprovider
node --test tests/*.test.cjs
npx tsc --noEmit
npx eslint app/dashboard/daily-tasks app/dashboard/campaign-schedule lib/campaign-dates.ts
```
