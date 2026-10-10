# Daily Tasks & Campaign Schedule

Uses the original `/dashboard/tasks` workspace with Daily Overview (default), Task Management and Campaign Schedule tabs. The former Daily Tasks and Campaign Schedule URLs redirect into this workspace. Uses the existing backend proxy, authentication, staff records and PostgreSQL tasks table. No new dependencies or media tools are introduced.

## UI cleanup release status

The initial campaign is already in production. This cleanup is prepared for approval and has not been deployed. It requires no database migration or setup run. Preserve all 40 original tasks, 32 campaign tasks and 10 campaign days.

The original sidebar is restored. Task Management retains its original employee filter, Active/Archive views, dedicated create/edit pages and owner-only create/delete controls. Campaign/general tasks use that same editor with existing daily-task endpoints; staff updates send only status and notes. Original product/service payloads and permissions are unchanged. The existing task response additionally exposes the stored campaign day ID so associated records can be shown without a second task interface.

Daily Overview contains four summary counts and a compact list of tasks due today. Campaign Schedule groups industry days by week, shows activities and progress, and links into the existing management view. There are no duplicate My Tasks/Team Tasks forms or added Leads/project shortcuts.

## Initial plan

- 12 October 2026: onboarding and assignment review for all three people.
- 13 October: Mobile Beauty Studio.
- 14 October: Cleaning Services.
- 15 October: Daycare Services.
- 16 October: Event Planning & Décor Services.
- 19–23 October: editable placeholders pending founder decisions.

Setup creates 10 campaign days and 32 tasks: 3 onboarding, 4 founder flyer tasks, 4 Colin verification/screenshot handoffs, 20 Kat suggested outreach/publication/Leads/follow-up assignments, and 1 Plumbing readiness task. Screenshot tasks are due on the previous working day and are created once per demo, not repeatedly each day. Flyer deadlines are the campaign dates, with early delivery encouraged. Video tasks can be added manually when required.

## Behaviour and permissions

Task lists continue to use the authenticated existing task API: administrators see the team and staff see only their assignments. Existing daily-task endpoints remain available. Campaign editing remains administrator-only. No records are reassigned, removed or reseeded by the cleanup.

Completion writes a UTC `completed_at` timestamp; note edits retain it. Reopening clears it. Date-only deadlines stay calendar dates; the browser computes today's date and renders timestamps in Africa/Johannesburg. Routine setup uses weekdays; manual campaign dates can include weekends. No automatic completion, reassignment or removal takes place.

## Validation

- 56 Python tests plus 10 existing subtests passed across the database/auth/permissions/task/calendar/invoice suites and the separately isolated public-chat suite.
- 16 JavaScript tests passed, including Johannesburg date rollover, date-only week grouping and UTC completion rendering.
- TypeScript and scoped ESLint checks passed.
- Cleanup browser checks at 390px and 1440px used mock identities and records: compact default overview, original Active/Archive and forms, campaign links, old URL redirects and staff progress-only updates. No browser exceptions or mobile horizontal overflow were detected.
- Read-only production audit confirms 72 tasks (40 original plus 32 seeded), 10 campaign days and the original seed assignments. No production writes were performed for this cleanup.
- A temporary PostgreSQL instance was populated from the original schema. The migration was applied twice; an original task remained intact. The authenticated setup endpoint was run twice: first run added 10 days/32 tasks, second run added zero. This instance had no production credentials or data.

The Python regression runner uses `DATABASE_URL=sqlite://` and does not import the application startup that creates tables. The public-chat isolation suite must be run separately because it asserts the database module was never imported. Run from the repository root:

```
PYTHONDONTWRITEBYTECODE=1 python tests/run_backend_regression.py
PYTHONDONTWRITEBYTECODE=1 DATABASE_URL=sqlite:// python -m pytest tests/test_public_chat.py -q -p no:cacheprovider
node --test tests/*.test.cjs
npx tsc --noEmit
npx eslint app/dashboard/tasks app/dashboard/daily-tasks/page.tsx app/dashboard/campaign-schedule/page.tsx lib/campaign-dates.ts
```
