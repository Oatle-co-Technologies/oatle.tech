"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import BackToDashboard from "@/components/dashboard/BackToDashboard";
import { displayDate, displayTimestamp, johannesburgDate, weekStart } from "@/lib/campaign-dates";

type View = "mine" | "team" | "schedule";
type Task = { id: number; name: string; description: string | null; assigned_to: number | null; due_date: string | null; campaign_day_id: number | null; status: string; notes: string | null; completed_at: string | null };
type Campaign = { id: number; focus_date: string; industry: string; campaign_name: string; description: string | null };
type Person = { id: number; name: string; active: boolean; access_level: string };
type TaskForm = { id?: number; name: string; description: string; assigned_to: string; due_date: string; campaign_day_id: string; status: string; notes: string };
type CampaignForm = { id?: number; focus_date: string; industry: string; campaign_name: string; description: string };
const statuses = [{ value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }, { value: "blocked", label: "Blocked" }];
const industries = ["Mobile Beauty Studio", "Cleaning Services", "Daycare Services", "Event Planning & Décor Services", "Plumbing Services"];
async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch("/api/backend/daily-tasks" + path, { method, cache: "no-store", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.detail === "string" ? data.detail : `Unable to save or load data (${response.status}). Please try again.`);
  return data as T;
}
function TaskCard({ task, person, campaign, today, busy, update, edit, duplicate, remove }: {
  task: Task; person?: string; campaign?: Campaign; today: string; busy: boolean;
  update: (id: number, values: { status?: string; notes?: string }) => Promise<boolean>;
  edit?: () => void; duplicate?: () => void; remove?: () => void;
}) {
  const [draft, setDraft] = useState({ saved: task.notes, value: task.notes || "" });
  const note = draft.saved === task.notes ? draft.value : task.notes || "";
  const overdue = task.status !== "completed" && task.due_date && task.due_date < today;
  return <article className={`dashboard-panel daily-task-card ${overdue ? "daily-overdue" : ""}`}>
    <div className="daily-card-heading"><h3>{task.name}</h3>{overdue && <span className="daily-badge">Overdue</span>}</div>
    {person && <p className="daily-meta">Assigned to {person}</p>}
    <p className="daily-description">{task.description || "No description added."}</p>
    <p className="daily-meta">{task.due_date ? `Due ${displayDate(task.due_date)}` : "No due date"}{campaign && ` · ${campaign.industry} (${displayDate(campaign.focus_date)})`}</p>
    <label>Status<select aria-label={`Status for ${task.name}`} disabled={busy} value={task.status} onChange={event => void update(task.id, { status: event.target.value })}>
      {!statuses.some(status => status.value === task.status) && <option value={task.status}>{task.status}</option>}
      {statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
    </select></label>
    <label>Progress notes<textarea aria-label={`Progress notes for ${task.name}`} maxLength={10000} disabled={busy} value={note} onChange={event => setDraft({ saved: task.notes, value: event.target.value })} onBlur={() => { if (note !== (task.notes || "")) void update(task.id, { notes: note }); }} placeholder="Progress, blockers or handoff details" /></label>
    <div className="daily-actions"><button type="button" disabled={busy || note === (task.notes || "")} onClick={() => void update(task.id, { notes: note })}>Save notes</button>
      {edit && <button type="button" disabled={busy} onClick={edit}>Edit</button>}
      {duplicate && <button type="button" disabled={busy} onClick={duplicate}>Duplicate</button>}
      {remove && <button type="button" disabled={busy} onClick={remove}>Delete</button>}
    </div>
    {task.completed_at && <p className="daily-meta">Completed {displayTimestamp(task.completed_at)} SAST</p>}
  </article>;
}
export default function DailyTasks({ initialView }: { initialView: View }) {
  const { staff } = useAuth();
  const admin = staff?.access_level === "admin";
  const [view, setView] = useState<View>(initialView);
  const [today, setToday] = useState(johannesburgDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({ person: "", date: "", status: "", campaign: "" });
  const [taskForm, setTaskForm] = useState<TaskForm | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignForm | null>(null);
  const [setup, setSetup] = useState<{ founder: string; kat: string; colin: string } | null>(null);
  const load = useCallback(async () => {
    if (!staff) return;
    setLoading(true); setError("");
    try {
      const [records, days, users] = await Promise.all([api<Task[]>(admin ? "?mine=false" : ""), api<Campaign[]>("/campaigns/schedule"), admin ? fetch("/api/backend/staff", { cache: "no-store" }).then(async response => { if (!response.ok) throw new Error("Unable to load team members"); return response.json() as Promise<Person[]>; }) : Promise.resolve([])]);
      setTasks(records); setCampaigns(days); setPeople(users.filter(person => person.active && ["admin", "member"].includes(person.access_level)));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load Daily Tasks"); }
    finally { setLoading(false); }
  }, [staff, admin]);
  useEffect(() => { let active = true; void Promise.resolve().then(() => { if (active) return load(); }); return () => { active = false; }; }, [load]);
  useEffect(() => { const timer = setInterval(() => setToday(johannesburgDate()), 30000); return () => clearInterval(timer); }, []);
  async function mutate(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); await load(); setMessage(success); window.dispatchEvent(new Event("oatle:tasks-changed")); return true; }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save changes"); return false; }
    finally { setBusy(false); }
  }
  async function update(id: number, values: { status?: string; notes?: string }) {
    setBusy(true); setError(""); setMessage("");
    try { const saved = await api<Task>(`/${id}/progress`, "PATCH", values); setTasks(current => current.map(task => task.id === saved.id ? saved : task)); setMessage("Progress saved."); window.dispatchEvent(new Event("oatle:tasks-changed")); return true; }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save progress"); return false; }
    finally { setBusy(false); }
  }
  const mine = tasks.filter(task => task.assigned_to === staff?.id);
  const base = view === "team" && admin ? tasks : mine;
  const visible = base.filter(task => (!filters.person || String(task.assigned_to) === filters.person) && (!filters.date || task.due_date === filters.date) && (!filters.status || task.status === filters.status) && (!filters.campaign || String(task.campaign_day_id) === filters.campaign));
  const complete = base.filter(task => task.status === "completed").length;
  const overdue = base.filter(task => task.status !== "completed" && task.due_date && task.due_date < today).length;
  const focus = campaigns.find(day => day.focus_date === today);
  const weeks = [...new Set(campaigns.map(day => weekStart(day.focus_date)))];
  function editTask(task: Task) { setTaskForm({ id: task.id, name: task.name, description: task.description || "", assigned_to: String(task.assigned_to || ""), due_date: task.due_date || "", campaign_day_id: String(task.campaign_day_id || ""), status: task.status, notes: task.notes || "" }); }
  function card(task: Task) { return <TaskCard key={task.id} task={task} today={today} busy={busy} person={view === "team" ? people.find(person => person.id === task.assigned_to)?.name : undefined} campaign={campaigns.find(day => day.id === task.campaign_day_id)} update={update} edit={admin ? () => editTask(task) : undefined} duplicate={admin ? () => void mutate(() => api(`/${task.id}/duplicate`, "POST"), "Task duplicated.") : undefined} remove={admin ? () => { if (window.confirm(`Delete “${task.name}”?`)) void mutate(() => api(`/${task.id}`, "DELETE"), "Task deleted."); } : undefined} />; }
  return <main className="daily-workspace"><BackToDashboard /><header className="dashboard-header"><div><p className="dashboard-eyebrow">Oatle team coordination</p><h1>Daily Tasks</h1><p className="dashboard-subtitle">{displayDate(today)} · Africa/Johannesburg</p><p>{focus ? `Today's focus: ${focus.industry}` : "No campaign focus scheduled for today."}</p></div></header>
    <nav className="daily-tabs" aria-label="Task views"><button type="button" aria-pressed={view === "mine"} onClick={() => { setView("mine"); setFilters({ person: "", date: "", status: "", campaign: "" }); }}>My Tasks</button>{admin && <button type="button" aria-pressed={view === "team"} onClick={() => setView("team")}>Team Tasks</button>}<button type="button" aria-pressed={view === "schedule"} onClick={() => setView("schedule")}>Campaign Schedule</button><Link href="/dashboard/leads">Open Leads</Link><Link href="/dashboard/tasks">Project & service tasks</Link></nav>
    {error && <div className="daily-error" role="alert">{error} <button type="button" disabled={busy} onClick={() => void load()}>Retry loading</button></div>}
    <p className="daily-feedback" role="status" aria-live="polite">{busy ? "Saving…" : message}</p>
    {loading ? <p role="status">Loading assignments and campaign schedule…</p> : <>
      {view !== "schedule" && <><div className="dashboard-stats daily-stats"><div className="dashboard-card"><p>Completed</p><h2>{complete} / {base.length}</h2></div><div className="dashboard-card"><p>Outstanding</p><h2>{base.length - complete}</h2></div><div className="dashboard-card"><p>Overdue</p><h2>{overdue}</h2></div><div className="dashboard-card"><p>Blocked</p><h2>{base.filter(task => task.status === "blocked").length}</h2></div></div>
      <div className="daily-filters">{admin && view === "team" && <label>Person<select value={filters.person} onChange={event => setFilters({ ...filters, person: event.target.value })}><option value="">Everyone</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}<label>Due date<input type="date" value={filters.date} onChange={event => setFilters({ ...filters, date: event.target.value })} /></label><label>Status<select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label><label>Campaign day<select value={filters.campaign} onChange={event => setFilters({ ...filters, campaign: event.target.value })}><option value="">All campaigns</option>{campaigns.map(day => <option key={day.id} value={day.id}>{displayDate(day.focus_date)} · {day.industry}</option>)}</select></label><button type="button" onClick={() => setFilters({ person: "", date: "", status: "", campaign: "" })}>Clear filters</button></div>
      {admin && <div className="daily-actions"><button type="button" disabled={busy} onClick={() => setTaskForm({ name: "", description: "", assigned_to: String(staff?.id || ""), due_date: today, campaign_day_id: "", status: "todo", notes: "" })}>Create task</button></div>}
      {visible.length === 0 && <p className="dashboard-empty">No assignments match this view.</p>}
      {view === "team" ? <div className="daily-grid">{visible.map(card)}</div> : <>{[
        { label: "Today", records: visible.filter(task => task.due_date === today) },
        { label: "Overdue & unfinished", records: visible.filter(task => task.status !== "completed" && (!task.due_date || task.due_date < today)) },
        { label: "Upcoming", records: visible.filter(task => task.due_date && task.due_date > today) },
        { label: "Previously completed", records: visible.filter(task => task.status === "completed" && (!task.due_date || task.due_date < today)) }
      ].map(group => group.records.length > 0 && <section className="daily-section" key={group.label}><h2>{group.label} <span>({group.records.length})</span></h2><div className="daily-grid">{group.records.map(card)}</div></section>)}</>}
      </>}
      {view === "schedule" && <section><div className="daily-actions">{admin && <><button type="button" onClick={() => setCampaignForm({ focus_date: today, industry: "", campaign_name: "October 2026 Demo Website Campaign", description: "" })}>Create campaign day</button><button type="button" onClick={() => setSetup({ founder: String(staff?.id || ""), kat: "", colin: "" })}>Set up initial campaign</button></>}</div><p className="daily-meta">Routine campaign days run Monday–Friday. The founder can schedule other dates. Plumbing joins when its demo is ready.</p>{weeks.length === 0 && <p className="dashboard-empty">No campaign days yet.</p>}{weeks.map(week => <section className="daily-section" key={week}><h2>Week of {displayDate(week)}</h2><div className="daily-schedule">{campaigns.filter(day => weekStart(day.focus_date) === week).map(day => <article className="dashboard-panel" key={day.id}><p className="daily-meta">{displayDate(day.focus_date)}</p><h3>{day.industry}</h3><p className="daily-meta">{day.campaign_name}</p><p className="daily-description">{day.description}</p><p>{tasks.filter(task => task.campaign_day_id === day.id && (admin || task.assigned_to === staff?.id) && task.status === "completed").length} / {tasks.filter(task => task.campaign_day_id === day.id && (admin || task.assigned_to === staff?.id)).length} {admin ? "team" : "my"} tasks completed</p><div className="daily-actions"><button type="button" onClick={() => { setFilters({ person: "", date: "", status: "", campaign: String(day.id) }); setView(admin ? "team" : "mine"); }}>View tasks</button>{admin && <button type="button" onClick={() => setCampaignForm({ id: day.id, focus_date: day.focus_date, industry: day.industry, campaign_name: day.campaign_name, description: day.description || "" })}>Edit day</button>}</div></article>)}</div></section>)}</section>}
    </>}
    {admin && taskForm && <section className="dashboard-panel daily-editor" aria-label="Task editor"><h2>{taskForm.id ? "Edit task" : "Create task"}</h2><form onSubmit={async event => { event.preventDefault(); const payload = { ...taskForm, assigned_to: Number(taskForm.assigned_to), campaign_day_id: taskForm.campaign_day_id ? Number(taskForm.campaign_day_id) : null, due_date: taskForm.due_date || null }; delete payload.id; if (await mutate(() => api(taskForm.id ? `/${taskForm.id}` : "", taskForm.id ? "PUT" : "POST", payload), "Assignment saved.")) setTaskForm(null); }}>
      <label>Title<input required maxLength={300} value={taskForm.name} onChange={event => setTaskForm({ ...taskForm, name: event.target.value })} /></label><label>Description<textarea maxLength={10000} value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })} /></label><label>Assign to<select required value={taskForm.assigned_to} onChange={event => setTaskForm({ ...taskForm, assigned_to: event.target.value })}><option value="">Select team member</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}{person.id === staff?.id ? " (you)" : ""}</option>)}</select></label><label>Due date<input type="date" value={taskForm.due_date} onChange={event => setTaskForm({ ...taskForm, due_date: event.target.value })} /></label><label>Campaign day (optional)<select value={taskForm.campaign_day_id} onChange={event => setTaskForm({ ...taskForm, campaign_day_id: event.target.value })}><option value="">No campaign</option>{campaigns.map(day => <option key={day.id} value={day.id}>{displayDate(day.focus_date)} · {day.industry}</option>)}</select></label><label>Status<select value={taskForm.status} onChange={event => setTaskForm({ ...taskForm, status: event.target.value })}>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label><label>Progress notes<textarea maxLength={10000} value={taskForm.notes} onChange={event => setTaskForm({ ...taskForm, notes: event.target.value })} /></label><div className="daily-actions"><button disabled={busy} type="submit">Save task</button><button disabled={busy} type="button" onClick={() => setTaskForm(null)}>Cancel</button></div></form></section>}
    {admin && campaignForm && <section className="dashboard-panel daily-editor" aria-label="Campaign editor"><h2>{campaignForm.id ? "Edit campaign day" : "Create campaign day"}</h2><form onSubmit={async event => { event.preventDefault(); const { id, ...payload } = campaignForm; if (await mutate(() => api(id ? `/campaigns/schedule/${id}` : "/campaigns/schedule", id ? "PUT" : "POST", payload), "Campaign day saved.")) setCampaignForm(null); }}><label>Date<input required type="date" value={campaignForm.focus_date} onChange={event => setCampaignForm({ ...campaignForm, focus_date: event.target.value })} /></label><label>Industry focus<input required maxLength={200} list="campaign-industries" value={campaignForm.industry} onChange={event => setCampaignForm({ ...campaignForm, industry: event.target.value })} /><datalist id="campaign-industries">{industries.map(industry => <option key={industry} value={industry} />)}</datalist></label><label>Campaign name<input required maxLength={200} value={campaignForm.campaign_name} onChange={event => setCampaignForm({ ...campaignForm, campaign_name: event.target.value })} /></label><label>Description<textarea maxLength={10000} value={campaignForm.description} onChange={event => setCampaignForm({ ...campaignForm, description: event.target.value })} /></label><div className="daily-actions"><button disabled={busy} type="submit">Save campaign day</button><button disabled={busy} type="button" onClick={() => setCampaignForm(null)}>Cancel</button></div></form></section>}
    {admin && setup && <section className="dashboard-panel daily-editor" aria-label="Initial campaign setup"><h2>First campaign setup</h2><p>Creates the schedule for 12–23 October, first-week flyer and outreach assignments, one screenshot handoff per demo, and Colin’s Plumbing task. Existing setup records and progress are preserved.</p><form onSubmit={async event => { event.preventDefault(); if (await mutate(() => api("/campaigns/initial-setup", "POST", { founder_id: Number(setup.founder), kat_id: Number(setup.kat), colin_id: Number(setup.colin) }), "Initial campaign is ready. Existing records were preserved.")) setSetup(null); }}>{(["founder", "kat", "colin"] as const).map(role => <label key={role}>{role === "founder" ? "Founder / designer" : role === "kat" ? "Kat / communications" : "Colin / technical"}<select required value={setup[role]} onChange={event => setSetup({ ...setup, [role]: event.target.value })}><option value="">Select existing user</option>{people.filter(person => role !== "founder" || person.access_level === "admin").map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>)}<div className="daily-actions"><button disabled={busy} type="submit">Create missing assignments</button><button disabled={busy} type="button" onClick={() => setSetup(null)}>Cancel</button></div></form></section>}
  </main>;
}
