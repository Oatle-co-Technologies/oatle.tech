"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { taskMatchesFilter, type TaskFilter } from "@/lib/task-filters";

type Task = { id: number; name: string; status: string; due_date: string | null };
type Lead = { id: number; name: string; company: string | null; stage: string };
type Project = { id: number; name: string; status: string; target_date: string | null };
const timezone = "Africa/Johannesburg";
const label = (value: string) => value.replaceAll("_", " ");

async function get<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/backend${path}`, { cache: "no-store", signal });
  if (!response.ok) throw new Error("Unable to load this overview. Please try again.");
  return response.json();
}

export default function MemberOverview() {
  const { staff } = useAuth();
  return staff ? <PersonalOverview key={staff.id} name={staff.name} staffId={staff.id} /> : null;
}

function PersonalOverview({ name, staffId }: { name: string; staffId: number }) {
  const [now, setNow] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workError, setWorkError] = useState("");
  const [workLoading, setWorkLoading] = useState(staffId === 7 || staffId === 9);
  const [revision, setRevision] = useState(0);
  const today = now.toLocaleDateString("en-CA", { timeZone: timezone });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    get<Task[]>("/tasks", controller.signal).then(setTasks)
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const extra = staffId === 7 ? get<Lead[]>("/leads", controller.signal).then(setLeads)
      : staffId === 9 ? get<Project[]>("/projects", controller.signal).then(setProjects) : null;
    extra?.catch(err => { if (!controller.signal.aborted) setWorkError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setWorkLoading(false); });
    return () => controller.abort();
  }, [staffId, revision]);

  function refresh() {
    setError(""); setWorkError(""); setLoading(true); setWorkLoading(staffId === 7 || staffId === 9); setRevision(value => value + 1);
  }
  const filters: { name: string; filter: TaskFilter }[] = [{ name: "Completed", filter: "completed" }, { name: "Outstanding", filter: "outstanding" }, { name: "Overdue", filter: "overdue" }, { name: "Blocked", filter: "blocked" }];
  const todayTasks = tasks.filter(task => task.due_date === today);
  const activeProjects = projects.filter(project => ["planning", "active", "on_hold"].includes(project.status));

  return <div className="member-overview">
    <header className="dashboard-header">
      <div><p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p><h1 className="dashboard-greeting">Hello {name.trim().split(/\s+/)[0]},</h1>
        <p className="dashboard-subtitle">I hope you&apos;re having a great day. Let&apos;s get to work.</p>
        <p className="dashboard-subtitle"><time dateTime={now.toISOString()} suppressHydrationWarning>{now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: timezone })} · {now.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", timeZone: timezone })}</time> · South Africa</p>
      </div><button className="dashboard-button" type="button" disabled={loading || workLoading} onClick={refresh}>Refresh</button>
    </header>
    <section aria-label="Your task overview">
      <div className="dashboard-panel-header"><div><p className="dashboard-panel-label">YOUR WORK</p><h2>Today&apos;s task overview</h2></div><Link className="dashboard-link" href="/dashboard/tasks">View all tasks</Link></div>
      {loading ? <p role="status">Loading your tasks…</p> : error ? <p role="alert">{error}</p> : <>
        <div className="dashboard-stats tasks-overview-stats">{filters.map(item => <Link key={item.filter} className="dashboard-card tasks-summary-link" href={`/dashboard/tasks?view=management&filter=${item.filter}`}><p>{item.name}</p><h2>{tasks.filter(task => taskMatchesFilter(task, item.filter, today)).length}</h2></Link>)}</div>
        <section className="dashboard-panel"><div className="dashboard-panel-header"><div><p className="dashboard-panel-label">TODAY</p><h3>Tasks due today</h3></div></div>
          {!todayTasks.length ? <p className="dashboard-empty">No tasks due today.</p> : <ul className="tasks-today-list">{todayTasks.map(task => <li key={task.id}><Link className="dashboard-link" href={`/dashboard/tasks/${task.id}`}>{task.name}</Link><span className="dashboard-subtitle">{label(task.status)}</span></li>)}</ul>}
        </section>
      </>}
    </section>
    {(staffId === 7 || staffId === 9) && <section className="dashboard-panel member-work-overview" aria-label={staffId === 7 ? "Sales lead pipeline" : "Projects overview"}>
      <div className="dashboard-panel-header"><div><p className="dashboard-panel-label">{staffId === 7 ? "COMMUNICATIONS" : "DEVELOPMENT"}</p><h3>{staffId === 7 ? "Sales lead pipeline" : "Projects overview"}</h3></div><Link className="dashboard-link" href={staffId === 7 ? "/dashboard/leads" : "/dashboard/projects"}>{staffId === 7 ? "View all leads" : "View all projects"}</Link></div>
      {workLoading ? <p role="status">Loading overview…</p> : workError ? <p role="alert">{workError}</p> : staffId === 7 ? <>
        <div className="lead-pipeline">{["new", "contacted", "proposal", "won"].map(stage => <div key={stage}><span>{stage.charAt(0).toUpperCase() + stage.slice(1)}</span><strong>{leads.filter(lead => lead.stage === stage).length}</strong></div>)}</div>
      </> : <>
        <p className="dashboard-subtitle">{activeProjects.length} projects in progress</p>
        {!activeProjects.length ? <p className="dashboard-empty">No projects in progress.</p> : <ul className="tasks-today-list">{activeProjects.slice(0,5).map(project => <li key={project.id}><div><Link className="dashboard-link" href={`/dashboard/projects/${project.id}`}>{project.name}</Link>{project.target_date && <p className="dashboard-subtitle">Target: {project.target_date}</p>}</div><span className="dashboard-subtitle">{label(project.status)}</span></li>)}</ul>}
      </>}
    </section>}
  </div>;
}
