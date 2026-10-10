"use client";

import { useState } from "react";
import { displayDate, weekStart } from "@/lib/campaign-dates";

type CampaignDay = {
  id: number;
  focus_date: string;
  industry: string;
  campaign_name: string;
  description: string | null;
};
type CampaignTask = {
  id: number;
  name: string;
  status: string;
  campaign_day_id?: number | null;
};
type CampaignForm = Omit<CampaignDay, "id" | "description"> & {
  id?: number;
  description: string;
};

export default function CampaignSchedule({ campaigns, tasks, isAdmin, loading, error, today, apiUrl, onRefresh, onViewTasks }: {
  campaigns: CampaignDay[];
  tasks: CampaignTask[];
  isAdmin: boolean;
  loading: boolean;
  error: string;
  today: string;
  apiUrl: string;
  onRefresh: () => Promise<void>;
  onViewTasks: (campaign: CampaignDay) => void;
}) {
  const [form, setForm] = useState<CampaignForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const weeks = [...new Set(campaigns.map(day => weekStart(day.focus_date)))];

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !isAdmin) return;
    setSaving(true);
    setSaveError("");
    setSuccess("");
    try {
      const { id, ...payload } = form;
      const response = await fetch(`${apiUrl}/daily-tasks/campaigns/schedule${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(typeof result?.detail === "string" ? result.detail : "Campaign day could not be saved.");
      }
      setForm(null);
      await onRefresh();
      setSuccess("Campaign day saved.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Campaign day could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <section aria-label="Campaign Schedule" className="tasks-campaign-schedule">
    <div className="dashboard-panel-header">
      <div><p className="dashboard-panel-label">CAMPAIGN SCHEDULE</p><h3>Weekly industry focus</h3></div>
      {isAdmin && <button type="button" className="dashboard-button dashboard-button-primary" onClick={() => {
        setSaveError("");
        setForm({ focus_date: today, industry: "", campaign_name: "October 2026 Demo Website Campaign", description: "" });
      }}>Create campaign day</button>}
    </div>
    {error && <p role="alert" className="dashboard-form-error">{error} <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => void onRefresh()}>Retry</button></p>}
    {loading ? <p role="status">Loading campaign schedule…</p> : <>
      {weeks.length === 0 && !error && <p className="dashboard-empty">No campaign days scheduled.</p>}
      {weeks.map(week => <section className="tasks-campaign-week" key={week}>
        <h3>Week of {displayDate(week)}</h3>
        <div className="tasks-week-grid">{campaigns.filter(day => weekStart(day.focus_date) === week).map(day => {
          const related = tasks.filter(task => task.campaign_day_id === day.id);
          const completed = related.filter(task => task.status === "completed").length;
          return <article className="dashboard-panel" key={day.id}>
            <p className="dashboard-panel-label">{displayDate(day.focus_date)}</p>
            <h3>{day.industry}</h3>
            <p className="dashboard-form-hint">{day.campaign_name}</p>
            {day.description && <p className="tasks-campaign-description">{day.description}</p>}
            <p className="tasks-campaign-progress">{completed} / {related.length} {isAdmin ? "team" : "your"} activities completed</p>
            {related.length > 0 && <details>
              <summary>Assigned activities ({related.length})</summary>
              <ul className="tasks-campaign-activities">{related.map(task => <li key={task.id}>
                <span>{task.name}</span><small>{task.status.replaceAll("_", " ")}</small>
              </li>)}</ul>
            </details>}
            <div className="dashboard-panel-actions tasks-campaign-actions">
              <button type="button" className="dashboard-button dashboard-button-secondary" onClick={() => onViewTasks(day)}>View tasks</button>
              {isAdmin && <button type="button" className="dashboard-button dashboard-button-edit" onClick={() => {
                setSaveError("");
                setForm({ id: day.id, focus_date: day.focus_date, industry: day.industry, campaign_name: day.campaign_name, description: day.description || "" });
              }}>Edit day</button>}
            </div>
          </article>;
        })}</div>
      </section>)}
    </>}
    <p role="status" className="dashboard-form-hint">{saving ? "Saving…" : success}</p>
    {saveError && <p className="dashboard-form-error" role="alert">{saveError}</p>}
    {isAdmin && form && <div className="dashboard-panel dashboard-form-panel" aria-label="Campaign day editor">
      <h3>{form.id ? "Edit campaign day" : "Create campaign day"}</h3>
      <form onSubmit={save}>
        <div className="dashboard-form-grid dashboard-task-form-grid">
          <label className="dashboard-task-form-row"><span>Date</span><input required type="date" value={form.focus_date} onChange={event => setForm({ ...form, focus_date: event.target.value })} /></label>
          <label className="dashboard-task-form-row"><span>Industry focus</span><input required maxLength={200} value={form.industry} onChange={event => setForm({ ...form, industry: event.target.value })} /></label>
          <label className="dashboard-task-form-row"><span>Campaign name</span><input required maxLength={200} value={form.campaign_name} onChange={event => setForm({ ...form, campaign_name: event.target.value })} /></label>
        </div>
        <label className="dashboard-task-form-row"><span>Description</span><textarea maxLength={10000} rows={4} className="dashboard-form-textarea" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
        <div className="dashboard-form-actions">
          <button type="submit" className="dashboard-button dashboard-button-primary" disabled={saving}>Save campaign day</button>
          <button type="button" className="dashboard-button dashboard-button-secondary" disabled={saving} onClick={() => setForm(null)}>Cancel</button>
        </div>
      </form>
    </div>}
  </section>;
}
