# Dashboard interaction regression tests

Run `npm ci`, then `npx playwright install chromium webkit` and `npm run test:e2e`.
The suite starts Next locally, or reuses the development server on 127.0.0.1:3000.
No account, environment credentials, or backend server is needed.

The tests cover member and admin record actions in iPhone WebKit, Android Chrome,
and desktop Chrome: one-tap Edit, lead follow-up date editing and UTC round trips,
email composition without sending, project details and progress saves, refresh,
reopening forms, and mobile menu navigation. `npm test` runs the unit regressions.

Every authentication and backend response is a fixture. External browser requests
are blocked. Only lead and progress PUT requests to specific fixture IDs are allowed,
and those update in-memory objects. Email sends and other writes fail the test.
Service workers are blocked so they cannot bypass request interception; service-worker
logic is separately covered by `tests/task-notifications-sw.test.cjs`.

Mobile engines and navigator.standalone are emulated. These tests do not establish
physical-device installed-PWA behavior or production authentication availability.
