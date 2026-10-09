const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function worker(current) {
  const events = {}, calls = { badges: [], notifications: [] };
  const self = { addEventListener: (name, callback) => { events[name] = callback; },
    navigator: { setAppBadge: async n => calls.badges.push(n), clearAppBadge: async () => calls.badges.push(0) },
    registration: { showNotification: async (title, options) => calls.notifications.push(options) },
    clients: { matchAll: async () => [] }, location: { origin: 'https://example.test' } };
  vm.runInNewContext(fs.readFileSync('public/task-notifications-sw.js', 'utf8'), { self, URL,
    fetch: async () => ({ ok: Boolean(current), json: async () => current }) });
  return { calls, push: () => new Promise((resolve,reject) => {
    events.push({ data: { json: () => ({ staff_id: 1, todo_count: 99 }) }, waitUntil: promise => promise.then(resolve,reject) });
  }) };
}
test('uses latest verified count instead of stale push count', async () => {
  const w=worker({staff_id:1,todo_count:3});await w.push();assert.deepEqual(w.calls.badges,[3]);assert.match(w.calls.notifications[0].body,/3 tasks/);
});
test('zero To Do tasks clears badge', async () => {
  const w=worker({staff_id:1,todo_count:0});await w.push();assert.deepEqual(w.calls.badges,[0]);
});
test('different signed-in account never receives another staff count', async () => {
  const w=worker({staff_id:2,todo_count:7});await w.push();assert.deepEqual(w.calls.badges,[0]);assert.equal(w.calls.notifications[0].body,'Open your workspace to check your tasks.');
});
test('unverified session uses generic notification without task count', async () => {
  const w=worker(null);await w.push();assert.deepEqual(w.calls.badges,[0]);assert.equal(w.calls.notifications[0].body,'Open your workspace to check your tasks.');
});

test('successive pushes create fresh, non-silent alerts even with no open windows', async () => {
  const w = worker({staff_id:1,todo_count:3});
  await w.push(); await w.push();
  assert.equal(w.calls.notifications.length, 2);
  for (const options of w.calls.notifications) {
    assert.equal(options.silent, false);
    assert.equal(options.tag, undefined);
    assert.deepEqual(Array.from(options.vibrate), [200,100,200]);
  }
});
