"use client";

type BadgeNavigator = Navigator & { setAppBadge?: (count: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
export async function setTaskBadge(count: number) {
  const badge = navigator as BadgeNavigator;
  try {
    if (count > 0) await badge.setAppBadge?.(count);
    else await badge.clearAppBadge?.();
  } catch { /* The dashboard count remains available when icon badges are unsupported. */ }
}

export async function disableTaskAlerts() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager?.getSubscription();
  if (subscription) {
    try {
      await fetch("/api/backend/task-notifications/subscription", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } finally { await subscription.unsubscribe(); }
  }
  await setTaskBadge(0);
}
