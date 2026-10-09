"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { disableTaskAlerts, setTaskBadge } from "@/lib/task-notifications";

type Summary = { todo_count: number; staff_id: number; public_key: string; push_enabled: boolean };
export default function TaskNotifications({ showControls = true, showCount = true }: { showControls?: boolean; showCount?: boolean }) {
  const { staff } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const staffId = staff?.id;
  useEffect(() => {
    let stopped = false;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        if (!staffId) { if (!stopped) setSummary(null); await setTaskBadge(0); return; }
        const response = await fetch("/api/backend/task-notifications/summary", { cache: "no-store" });
        if (!response.ok) return;
        const data: Summary = await response.json();
        if (stopped || data.staff_id !== staffId) return;
        setSummary(data);
        await setTaskBadge(data.todo_count);
      } catch { /* Keep the last count on temporary network errors. */ }
      finally { inFlight = false; }
    };
    const visibleRefresh = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    if (staffId && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/task-notifications-sw.js", { scope: "/", updateViaCache: "none" })
        .then(async (registration) => {
          const subscription = await registration.pushManager?.getSubscription();
          if (!stopped) setEnabled(Boolean(subscription));
        }).catch(() => {});
    }
    const interval = window.setInterval(visibleRefresh, 60000);
    window.addEventListener("oatle:tasks-changed", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    window.addEventListener("online", visibleRefresh);
    const pushRefresh = () => { void refresh(); };
    navigator.serviceWorker?.addEventListener("message", pushRefresh);
    return () => {
      stopped = true; window.clearInterval(interval);
      window.removeEventListener("oatle:tasks-changed", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      window.removeEventListener("online", visibleRefresh);
      navigator.serviceWorker?.removeEventListener("message", pushRefresh);
    };
  }, [staffId]);

  async function toggleAlerts() {
    setBusy(true); setMessage("");
    try {
      if (enabled) { await disableTaskAlerts(); setEnabled(false); if (summary) await setTaskBadge(summary.todo_count); return; }
      if (!summary?.push_enabled) { setMessage("Task alerts will be available after the next deployment."); return; }
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
      if (ios && !installed) {
        setMessage("Open Oatle from its Home Screen icon to enable iPhone notifications and icon badges."); return;
      }
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setMessage("On iPhone, add Oatle to your Home Screen and open it there to enable alerts. This browser may not support push alerts."); return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMessage("Allow notifications in your browser or device settings to receive task alerts."); return; }
      const registration = await navigator.serviceWorker.ready;
      const padded = summary.public_key.replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
      const key = Uint8Array.from(raw, (char) => char.charCodeAt(0));
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const response = await fetch("/api/backend/task-notifications/subscription", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) { await subscription.unsubscribe(); throw new Error("Could not enable task alerts. Please try again."); }
      setEnabled(true); await setTaskBadge(summary.todo_count);
      setMessage("Task alerts are enabled on this device.");
    } catch { setMessage("Could not update task alerts. Please try again."); }
    finally { setBusy(false); }
  }
  if (!staff) return null;
  return <section className="dashboard-task-notifications" aria-label="Your task notifications">
    {showCount && <Link href="/dashboard/tasks" className="dashboard-task-notification-count">
      <Bell size={17} aria-hidden="true" />
      <span>Your To Do tasks</span>
      <strong aria-live="polite" aria-atomic="true">{summary ? summary.todo_count : "…"}</strong>
    </Link>}
    {showControls && <button type="button" onClick={() => void toggleAlerts()} disabled={busy}>
      {busy ? "Updating…" : enabled ? "Disable task alerts" : "Enable task alerts"}
    </button>}
    {showControls && <p className="dashboard-form-hint">Enable alerts here on each phone, even if notifications are already allowed in phone settings. On iPhone, open Oatle from its Home Screen icon. On Android, use a browser that supports push notifications. Allow Sounds and Badges in your phone settings.</p>}
    {showControls && message && <p role="status">{message}</p>}
  </section>;
}
