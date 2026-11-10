import { test, expect } from '@playwright/test';

// All auth/data are synthetic. The test cannot contact customer systems.
test.beforeEach(async ({ context, page }, testInfo) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
  });
  const lead = { id: 7, name: 'Fixture Lead', email: 'lead@example.invalid', stage: 'new', contact_attempts: 0, next_follow_up_at: '2026-11-10T22:30:00', marketing_email_opt_in: true };
  const project = { id: 9, client_id: 2, product_id: null, name: 'Fixture Project', plan: 'Custom', status: 'planning', created_at: '2026-11-01T00:00:00' };
  let details = { status: 'planning', can_edit: true, progress: { phase: 'brief', current_update: 'Fixture update' }, tasks: [], available_tasks: [], history: [] };
  page.fixtureWrites = [];
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:3000') return route.abort();
    const path = url.pathname.replace(/\/$/, '');
    const respond = json => route.fulfill({ json });
    if (path.startsWith('/api/auth/')) return respond({ user: { id: 'fixture', email: 'tester@example.invalid', name: 'Tester' }, session: { id: 'fixture', userId: 'fixture', expiresAt: '2099-01-01T00:00:00Z' } });
    if (!path.startsWith('/api/backend/')) return route.continue();
    if (request.method() !== 'GET') {
      // Only these two in-memory writes are permitted. Email sending is forbidden.
      if (request.method() === 'PUT' && path === '/api/backend/leads/7') {
        const payload = request.postDataJSON(); Object.assign(lead, payload);
        page.fixtureWrites.push({ path, payload }); return respond(lead);
      }
      if (request.method() === 'PUT' && path === '/api/backend/project-progress/9') {
        const payload = request.postDataJSON(); details = { ...details, status: payload.status, progress: payload };
        page.fixtureWrites.push({ path, payload }); return respond(details);
      }
      throw new Error(`Forbidden test write: ${request.method()} ${path}`);
    }
    if (path.endsWith('/auth/me')) return respond({ id: 1, name: 'Tester', email: 'tester@example.invalid', access_level: testInfo.title.startsWith('admin') ? 'admin' : 'member', active: true });
    if (path.endsWith('/task-notifications/summary')) return respond({ staff_id: 1, todo_count: 0, push_enabled: false });
    if (path.endsWith('/leads')) return respond([lead]);
    if (path.endsWith('/projects')) return respond([project]);
    if (path.endsWith('/clients')) return respond([{ id: 2, name: 'Fixture Client', company: 'Fixture' }]);
    if (path.endsWith('/project-progress/summary')) return respond({ waiting_on_clients: 0, on_hold: 0, followups_due: 0, ready_to_continue: 0 });
    if (path.endsWith('/project-progress/9')) return respond(details);
    return respond([]);
  });
});

async function activate(locator, isMobile) {
  if (isMobile) await locator.tap(); else await locator.click();
}

test('single activation opens lead edit, date saves correctly, and email composer is usable', async ({ page, isMobile }) => {
  await page.goto('/dashboard/leads');
  const edit = page.getByRole('link', { name: 'Edit', exact: true });
  await expect(edit).toBeVisible();
  // Hover must never move controls, including at tablet/desktop widths.
  const before = await edit.boundingBox();
  if (!isMobile) { await page.getByRole('heading', { name: 'Fixture Lead', exact: true }).hover(); await page.waitForTimeout(200); }
  const after = await edit.boundingBox();
  expect(after.x).toBeCloseTo(before.x, 0); expect(after.y).toBeCloseTo(before.y, 0);
  await activate(edit, isMobile);
  await expect(page.getByRole('heading', { name: 'Edit Lead', exact: true })).toBeVisible();
  const followup = page.getByLabel('Next follow-up', { exact: true });
  await expect(followup).toHaveValue('2026-11-11T00:30');
  await activate(followup, isMobile);
  await followup.fill('2026-11-12T09:45');
  await activate(page.getByRole('button', { name: 'Update Lead', exact: true }), isMobile);
  await expect(page).toHaveURL(/\/dashboard\/leads$/);
  expect(page.fixtureWrites[0].payload.next_follow_up_at).toBe('2026-11-12T07:45:00.000Z');
  await activate(page.getByRole('link', { name: 'Edit', exact: true }), isMobile);
  await expect(followup).toHaveValue('2026-11-12T09:45');
  await page.reload(); await expect(followup).toHaveValue('2026-11-12T09:45');
  await activate(page.getByRole('link', { name: '← Back to leads' }), isMobile);
  await activate(page.getByRole('link', { name: 'Email Follow-Up', exact: true }), isMobile);
  await page.getByLabel('Subject', { exact: true }).fill('Fixture subject');
  await page.getByLabel('Message', { exact: true }).fill('Fixture message — never sent');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Fixture message — never sent');
  await page.reload(); await expect(page.getByLabel('Subject', { exact: true })).toBeVisible();
  expect(page.fixtureWrites).toHaveLength(1);
});

test('project edit and progress controls work after navigation and refresh', async ({ page, isMobile }) => {
  await page.goto('/dashboard/projects');
  await activate(page.getByRole('link', { name: 'Edit', exact: true }), isMobile);
  await expect(page.getByRole('heading', { name: 'Edit Project', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Edit Project', exact: true })).toBeVisible();
  await activate(page.getByRole('link', { name: '← Back to projects' }), isMobile);
  await activate(page.getByRole('link', { name: 'View progress & details' }), isMobile);
  await activate(page.getByRole('button', { name: 'Add progress update' }), isMobile);
  await page.getByRole('combobox', { name: /^Project status/ }).selectOption('waiting_for_client');
  await page.getByLabel('What are you waiting for from the client?').fill('Fixture assets');
  await activate(page.getByLabel('Set a follow-up date', { exact: true }), isMobile);
  await page.getByLabel('Follow-up date', { exact: true }).fill('2026-11-15');
  await activate(page.getByRole('button', { name: 'Save progress', exact: true }), isMobile);
  await expect(page.getByText('Project progress saved.', { exact: true })).toBeVisible();
  expect(page.fixtureWrites[0].payload.follow_up_date).toBe('2026-11-15');
  await page.reload(); await expect(page.getByText('Fixture assets', { exact: true })).toBeVisible();
  await activate(page.getByRole('button', { name: 'Add progress update' }), isMobile);
  await expect(page.getByLabel('Follow-up date', { exact: true })).toHaveValue('2026-11-15');
  await activate(page.getByRole('button', { name: 'Cancel', exact: true }), isMobile);
  expect(page.fixtureWrites).toHaveLength(1);
  if (isMobile) {
    await activate(page.getByRole('button', { name: 'Menu', exact: true }), true);
    await activate(page.getByRole('link', { name: 'Leads', exact: true }), true);
    await expect(page).toHaveURL(/\/dashboard\/leads$/);
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await activate(page.getByRole('link', { name: 'Edit', exact: true }), true);
    await expect(page.getByRole('heading', { name: 'Edit Lead', exact: true })).toBeVisible();
  }
});

test('admin can open lead and project controls with a single activation', async ({ page, isMobile }) => {
  await page.goto('/dashboard/leads');
  await activate(page.getByRole('link', { name: 'Edit', exact: true }), isMobile);
  await expect(page.getByRole('heading', { name: 'Edit Lead', exact: true })).toBeVisible();
  await activate(page.getByRole('link', { name: '← Back to leads' }), isMobile);
  await activate(page.getByRole('link', { name: 'Email Follow-Up', exact: true }), isMobile);
  await expect(page.getByLabel('Subject', { exact: true })).toBeVisible();
  await page.goto('/dashboard/projects');
  await activate(page.getByRole('link', { name: 'Edit', exact: true }), isMobile);
  await expect(page.getByRole('heading', { name: 'Edit Project', exact: true })).toBeVisible();
  await activate(page.getByRole('link', { name: '← Back to projects' }), isMobile);
  await activate(page.getByRole('link', { name: 'View progress & details' }), isMobile);
  await activate(page.getByRole('button', { name: 'Add progress update' }), isMobile);
  await expect(page.getByRole('combobox', { name: /^Project status/ })).toBeVisible();
  expect(page.fixtureWrites).toHaveLength(0);
});
