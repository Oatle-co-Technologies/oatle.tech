/* No fetch handler or offline cache: authentication and dashboard data stay on the server. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let count = null;
    try {
      const payload = event.data?.json();
      // Verify the current account and latest count rather than trust delayed push data.
      const response = await fetch("/api/backend/task-notifications/summary", { credentials: "include", cache: "no-store" });
      if (response.ok) {
        const current = await response.json();
        if (current.staff_id === payload?.staff_id) count = current.todo_count;
      }
    } catch { /* A generic notification is still safe when the session cannot be verified. */ }
    try {
      if (count > 0) await self.navigator.setAppBadge?.(count);
      else if (count === 0 || count === null) await self.navigator.clearAppBadge?.();
    } catch { /* Icon badging is not supported on every device. */ }
    await self.registration.showNotification("Oatle task update", {
      body: count === null ? "Open your workspace to check your tasks." : count > 0
        ? `You have ${count} task${count === 1 ? "" : "s"} still To Do.` : "You have no tasks still To Do.",
      // Each push is a fresh alert; reusing a tag can silently replace the previous alert.
      icon: "/icons/icon-192.png", silent: false, vibrate: [200, 100, 200],
      data: { url: "/dashboard/tasks" },
    });
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) client.postMessage({ type: "oatle:tasks-changed" });
  })());
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && "focus" in client) {
        await client.navigate("/dashboard/tasks"); return client.focus();
      }
    }
    return self.clients.openWindow("/dashboard/tasks");
  })());
});
