"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Status = "planning" | "active" | "waiting_for_client" | "on_hold" | "completed" | "cancelled";
type Phase = "brief" | "design" | "client_input" | "delivery";
type Progress = { phase: Phase; current_update: string | null; waiting_for: string | null; hold_reason: string | null; expected_input: string | null; next_action: string | null; delivery_choice: string | null; follow_up_date: string | null };
type Task = { id: number; name: string; status: string; assigned_to: number | null; due_date: string | null };
type Details = { status: Status; can_edit: boolean; progress: Progress; tasks: Task[]; available_tasks: Task[]; history: { id: number; created_at: string; by: string; snapshot: Progress & { status: Status; linked_task?: string } }[] };
const statuses: Status[] = ["planning", "active", "waiting_for_client", "on_hold", "completed", "cancelled"];
const text = (value: string) => value.replaceAll("_", " ");
type OptionalField = "expected_input" | "next_action" | "delivery_choice" | "follow_up_date" | "task";
const optionalFields: [OptionalField, string][] = [["expected_input", "Add expected timing"], ["next_action", "Add next action"], ["delivery_choice", "Add client decision or delivery details"], ["follow_up_date", "Set a follow-up date"], ["task", "Link an existing task"]];
const API = process.env.NEXT_PUBLIC_API_URL || "/api/backend";
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, { cache: "no-store", ...options });
  const result = await response.json();
  if (!response.ok) {
    const detail = typeof result.detail === "string" ? result.detail : Array.isArray(result.detail) ? result.detail[0]?.msg : null;
    throw new Error(detail || "Could not save project progress. Please try again.");
  }
  return result;
}

export function ProjectProgressSummary() {
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const load = () => request<Record<string, number>>("/project-progress/summary", { signal: controller.signal }).then(setSummary).catch(() => { if (!controller.signal.aborted) setError("Progress totals could not be loaded."); });
    void load(); window.addEventListener("oatle:project-progress-changed", load);
    return () => { controller.abort(); window.removeEventListener("oatle:project-progress-changed", load); };
  }, []);
  return <section aria-label="Client progress overview">{error && <p role="alert">{error}</p>}{summary && <div className="dashboard-stats project-progress-stats">{[["waiting_on_clients", "Waiting on clients"], ["on_hold", "On-hold projects"], ["followups_due", "Follow-ups due"], ["ready_to_continue", "Ready to continue"]].map(([key, label]) => <div key={key} className="dashboard-card"><p>{label}</p><h2>{summary[key]}</h2></div>)}</div>}</section>;
}

export default function ProjectProgress({ projectId, onSaved }: { projectId: number; onSaved: (status: string) => void }) {
  const [details, setDetails] = useState<Details | null>(null);
  const [draft, setDraft] = useState<Progress | null>(null);
  const [status, setStatus] = useState<Status>("planning");
  const [linkTask, setLinkTask] = useState("");
  const [enabled, setEnabled] = useState<OptionalField[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Details>(`/project-progress/${projectId}`, { signal: controller.signal }).then(value => { setDetails(value); setDraft(value.progress); setStatus(value.status); }).catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [projectId]);
  function startEditing() {
    if (!details) return;
    setDraft(details.progress); setStatus(details.status); setLinkTask("");
    setEnabled(optionalFields.filter(([key]) => key !== "task" && Boolean(details.progress[key])).map(([key]) => key));
    setEditing(true);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = { ...draft, status,
        waiting_for: status === "waiting_for_client" ? draft.waiting_for : null,
        hold_reason: status === "on_hold" ? draft.hold_reason : null,
        expected_input: status === "waiting_for_client" && enabled.includes("expected_input") ? draft.expected_input : null,
        next_action: enabled.includes("next_action") ? draft.next_action : null,
        delivery_choice: enabled.includes("delivery_choice") ? draft.delivery_choice : null,
        follow_up_date: enabled.includes("follow_up_date") ? draft.follow_up_date || null : null,
        linked_task_id: enabled.includes("task") && linkTask ? Number(linkTask) : null };
      const value = await request<Details>(`/project-progress/${projectId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setDetails(value); setDraft(value.progress); setStatus(value.status); setLinkTask(""); setEditing(false); setNotice("Project progress saved."); onSaved(value.status); window.dispatchEvent(new Event("oatle:project-progress-changed"));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save progress."); }
    finally { setSaving(false); }
  }
  async function updateTask(task: Task, value: string) {
    setSaving(true); setError("");
    try {
      await request(`/daily-tasks/${task.id}/progress`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) });
      const fresh = await request<Details>(`/project-progress/${projectId}`); setDetails(fresh); setNotice("Task progress updated. No new task was created.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update task."); }
    finally { setSaving(false); }
  }
  if (!details || !draft) return <section className="dashboard-panel">{error ? <p role="alert">{error}</p> : <p role="status">Loading project progress…</p>}</section>;
  const progress = details.progress;
  return <section className="dashboard-panel project-progress-panel">
    <div className="dashboard-panel-header"><div><p className="dashboard-panel-label">CLIENT PROGRESS</p><h3>Where this project stands</h3></div><span className="project-progress-status">{text(details.status)}</span></div>
    {error && <p className="dashboard-form-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <dl className="project-progress-facts">{[["Current update", progress.current_update], ["Waiting for", details.status === "waiting_for_client" ? progress.waiting_for : null], ["On-hold reason", details.status === "on_hold" ? progress.hold_reason : null], ["Expected timing", details.status === "waiting_for_client" ? progress.expected_input : null], ["Next action", progress.next_action], ["Client decisions / delivery", progress.delivery_choice], ["Follow-up date", progress.follow_up_date]].filter(([, value]) => Boolean(value)).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not set yet"}</dd></div>)}</dl>
    {!editing && details.can_edit && <button type="button" className="dashboard-button dashboard-button-primary" onClick={startEditing}>Add progress update</button>}
    {editing && <form onSubmit={save} className="project-progress-form"><h3>Update this project</h3><div className="dashboard-form-grid">
      <label>Project status<select value={status} disabled={saving} onChange={event => setStatus(event.target.value as Status)}>{statuses.map(value => <option key={value} value={value}>{text(value)}</option>)}</select></label>
      <label>Current update<textarea maxLength={3000} value={draft.current_update || ""} disabled={saving} onChange={event => setDraft({ ...draft, current_update: event.target.value })} placeholder="What has happened so far?" /></label>
      {status === "waiting_for_client" && <label>What are you waiting for from the client?<textarea maxLength={1000} required={status === "waiting_for_client"} value={draft.waiting_for || ""} disabled={saving} onChange={event => setDraft({ ...draft, waiting_for: event.target.value })} placeholder="For example, a photo or page content" /></label>}
      {status === "on_hold" && <label>On-hold reason<textarea maxLength={1000} required={status === "on_hold"} value={draft.hold_reason || ""} disabled={saving} onChange={event => setDraft({ ...draft, hold_reason: event.target.value })} placeholder="For example, waiting for budget" /></label>}
      <fieldset className="project-progress-options"><legend>Add details</legend>{optionalFields.filter(([key]) => key !== "expected_input" || status === "waiting_for_client").map(([key, label]) => <label key={key}><input type="checkbox" checked={enabled.includes(key)} disabled={saving} onChange={event => setEnabled(current => event.target.checked ? [...current, key] : current.filter(value => value !== key))} />{label}</label>)}</fieldset>
      {status === "waiting_for_client" && enabled.includes("expected_input") && <label>When is it expected?<input maxLength={250} value={draft.expected_input || ""} disabled={saving} onChange={event => setDraft({ ...draft, expected_input: event.target.value })} placeholder="For example, next week" /></label>}
      {enabled.includes("next_action") && <label>Next action<textarea maxLength={1000} value={draft.next_action || ""} disabled={saving} onChange={event => setDraft({ ...draft, next_action: event.target.value })} /></label>}
      {enabled.includes("delivery_choice") && <label>Client decisions / delivery<input maxLength={250} value={draft.delivery_choice || ""} disabled={saving} onChange={event => setDraft({ ...draft, delivery_choice: event.target.value })} placeholder="For example, deliver through a link" /></label>}
      {enabled.includes("follow_up_date") && <label>Follow-up date<input type="date" value={draft.follow_up_date || ""} disabled={saving} onChange={event => setDraft({ ...draft, follow_up_date: event.target.value || null })} /></label>}
      {enabled.includes("task") && <label>Link an existing task<select value={linkTask} disabled={saving} onChange={event => setLinkTask(event.target.value)}><option value="">Keep existing linked tasks</option>{details.available_tasks.map(task => <option key={task.id} value={task.id}>{task.name}</option>)}</select></label>}
    </div><p className="dashboard-subtitle">This records the project’s situation. It does not create a new task. Choose “Active” when the client sends what you need. Turning off an optional detail removes it when you save; previous updates stay in the history.</p><button type="submit" className="dashboard-button dashboard-button-primary" disabled={saving}>{saving ? "Saving…" : "Save progress"}</button>{" "}<button type="button" className="dashboard-button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button></form>}
    <section className="project-linked-tasks"><h3>Linked work</h3><p className="dashboard-subtitle">{details.tasks.filter(task => task.status === "completed").length} of {details.tasks.length} tasks completed</p>{!details.tasks.length ? <p>No task linked yet. Use the existing-task selector above to connect your current work.</p> : <ul>{details.tasks.map(task => <li key={task.id}><Link className="dashboard-link" href={`/dashboard/tasks/${task.id}/view`}>{task.name}</Link><select aria-label={`Status for ${task.name}`} value={task.status} disabled={saving || !details.can_edit} onChange={event => void updateTask(task, event.target.value)}>{["todo", "in_progress", "blocked", "completed"].map(value => <option key={value} value={value}>{text(value)}</option>)}</select></li>)}</ul>}</section>
    <section className="project-progress-history"><h3>Progress history</h3>{!details.history.length ? <p className="dashboard-subtitle">Your first progress update will appear here.</p> : <ol>{details.history.map(event => <li key={event.id}><time>{new Date(`${event.created_at}${event.created_at.endsWith("Z") ? "" : "Z"}`).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" })}</time><strong>{text(event.snapshot.status)} · {event.by}</strong><p>{event.snapshot.current_update || event.snapshot.next_action || "Project progress updated"}</p>{event.snapshot.waiting_for && <p>Waiting for: {event.snapshot.waiting_for}</p>}{event.snapshot.hold_reason && <p>On hold: {event.snapshot.hold_reason}</p>}{event.snapshot.delivery_choice && <p>Decision: {event.snapshot.delivery_choice}</p>}{event.snapshot.follow_up_date && <p>Follow up: {event.snapshot.follow_up_date}</p>}{event.snapshot.linked_task && <p>Linked existing task: {event.snapshot.linked_task}</p>}</li>)}</ol>}</section>
  </section>;
}
