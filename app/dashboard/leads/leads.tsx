"use client";

import { useEffect, useState } from "react";
import BackToDashboard from "@/components/dashboard/BackToDashboard";

type Lead = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  source: string | null;
  stage: string;
  response: string | null;
  follow_up_reason: string | null;
  contact_attempts: number;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  marketing_email_opt_in: boolean;
  marketing_sms_opt_in: boolean;
};

type LeadForm = {
  name: string;
  email: string;
  company: string;
  phone: string;
  source: string;
  stage: string;
  response: string;
  follow_up_reason: string;
  contact_attempts: number;
  last_contacted_at: string;
  next_follow_up_at: string;
  notes: string;
  marketing_email_opt_in: boolean;
  marketing_sms_opt_in: boolean;
};

const emptyForm: LeadForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
  source: "",
  stage: "new",
  response: "",
  follow_up_reason: "",
  contact_attempts: 0,
  last_contacted_at: "",
  next_follow_up_at: "",
  notes: "",
  marketing_email_opt_in: false,
  marketing_sms_opt_in: false,
};

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(
    date.getTime() - offset * 60 * 1000
  );

  return localDate.toISOString().slice(0, 16);
}

function toISOStringOrNull(value: string) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] =
    useState<Lead | null>(null);

  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/leads/"
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load leads (${response.status})`
        );
      }

      const data: Lead[] = await response.json();

      setLeads(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load leads"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function openAddForm() {
    setEditingLead(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(lead: Lead) {
    setEditingLead(lead);

    setForm({
      name: lead.name,
      email: lead.email,
      company: lead.company ?? "",
      phone: lead.phone ?? "",
      source: lead.source ?? "",
      stage: lead.stage,
      response: lead.response ?? "",
      follow_up_reason:
        lead.follow_up_reason ?? "",
      contact_attempts: lead.contact_attempts,
      last_contacted_at: toDateTimeLocal(
        lead.last_contacted_at
      ),
      next_follow_up_at: toDateTimeLocal(
        lead.next_follow_up_at
      ),
      notes: lead.notes ?? "",
      marketing_email_opt_in:
        lead.marketing_email_opt_in,
      marketing_sms_opt_in:
        lead.marketing_sms_opt_in,
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingLead(null);
    setForm(emptyForm);
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "contact_attempts"
          ? Number(value)
          : value,
    }));
  }

  function handleCheckboxChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
        company: form.company || null,
        phone: form.phone || null,
        source: form.source || null,
        response: form.response || null,
        follow_up_reason:
          form.follow_up_reason || null,
        last_contacted_at: toISOStringOrNull(
          form.last_contacted_at
        ),
        next_follow_up_at: toISOStringOrNull(
          form.next_follow_up_at
        ),
        notes: form.notes || null,
      };

      const url = editingLead
        ? `http://127.0.0.1:8000/leads/${editingLead.id}`
        : "http://127.0.0.1:8000/leads/";

      const method = editingLead ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${
            editingLead ? "update" : "create"
          } lead (${response.status})`
        );
      }

      closeForm();
      await loadLeads();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLead(
    lead: Lead,
    changes: Partial<Lead>
  ) {
    try {
      setError("");

      const payload = {
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        source: lead.source,
        stage: changes.stage ?? lead.stage,
        response:
          changes.response ?? lead.response,
        follow_up_reason:
          changes.follow_up_reason ??
          lead.follow_up_reason,
        contact_attempts:
          changes.contact_attempts ??
          lead.contact_attempts,
        last_contacted_at:
          changes.last_contacted_at ??
          lead.last_contacted_at,
        next_follow_up_at:
          changes.next_follow_up_at ??
          lead.next_follow_up_at,
        notes: changes.notes ?? lead.notes,
        marketing_email_opt_in:
          changes.marketing_email_opt_in ??
          lead.marketing_email_opt_in,
        marketing_sms_opt_in:
          changes.marketing_sms_opt_in ??
          lead.marketing_sms_opt_in,
      };

      const response = await fetch(
        `http://127.0.0.1:8000/leads/${lead.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update lead (${response.status})`
        );
      }

      await loadLeads();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update lead"
      );
    }
  }

  async function contactAgain(lead: Lead) {
    await updateLead(lead, {
      stage: "contacted",
      contact_attempts:
        lead.contact_attempts + 1,
      last_contacted_at:
        new Date().toISOString(),
    });
  }

  async function markNotNow(lead: Lead) {
    await updateLead(lead, {
      stage: "not_now",
      response: "not_now",
    });
  }

  async function markDropped(lead: Lead) {
    const confirmed = window.confirm(
      `Drop ${lead.name} from the active pipeline?`
    );

    if (!confirmed) {
      return;
    }

    await updateLead(lead, {
      stage: "dropped",
    });
  }

  async function handleDelete(leadId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this lead?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/leads/${leadId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete lead (${response.status})`
        );
      }

      await loadLeads();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete lead"
      );
    }
  }

  return (
    <div>
      <BackToDashboard />

      {/* Header controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          className="dashboard-link"
          onClick={openAddForm}
        >
          + Add Lead
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "24px" }}
        >
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                {editingLead
                  ? "EDIT LEAD"
                  : "NEW LEAD"}
              </p>

              <h3>
                {editingLead
                  ? "Edit Lead"
                  : "Add Lead"}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                name="company"
                placeholder="Company"
                value={form.company}
                onChange={handleChange}
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
              />

              <input
                name="source"
                placeholder="Source (Website, Referral, LinkedIn...)"
                value={form.source}
                onChange={handleChange}
              />

              <select
                name="stage"
                value={form.stage}
                onChange={handleChange}
              >
                <option value="new">New</option>
                <option value="contacted">
                  Contacted
                </option>
                <option value="responded">
                  Responded
                </option>
                <option value="proposal">
                  Proposal
                </option>
                <option value="not_now">
                  Not Now
                </option>
                <option value="won">Won</option>
                <option value="dropped">
                  Dropped
                </option>
              </select>

              <select
                name="response"
                value={form.response}
                onChange={handleChange}
              >
                <option value="">
                  No response recorded
                </option>
                <option value="yes">
                  Yes / Interested
                </option>
                <option value="no">No</option>
                <option value="not_now">
                  Not Now
                </option>
              </select>

              <input
                name="follow_up_reason"
                placeholder="Follow-up reason"
                value={form.follow_up_reason}
                onChange={handleChange}
              />

              <input
                name="contact_attempts"
                type="number"
                min="0"
                placeholder="Contact attempts"
                value={
                  form.contact_attempts
                }
                onChange={handleChange}
              />

              <label>
                Last contacted
                <input
                  name="last_contacted_at"
                  type="datetime-local"
                  value={
                    form.last_contacted_at
                  }
                  onChange={handleChange}
                />
              </label>

              <label>
                Next follow-up
                <input
                  name="next_follow_up_at"
                  type="datetime-local"
                  value={
                    form.next_follow_up_at
                  }
                  onChange={handleChange}
                />
              </label>
            </div>

            <textarea
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%",
                marginTop: "16px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "16px",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  name="marketing_email_opt_in"
                  checked={
                    form.marketing_email_opt_in
                  }
                  onChange={
                    handleCheckboxChange
                  }
                />{" "}
                Email marketing
              </label>

              <label>
                <input
                  type="checkbox"
                  name="marketing_sms_opt_in"
                  checked={
                    form.marketing_sms_opt_in
                  }
                  onChange={
                    handleCheckboxChange
                  }
                />{" "}
                SMS marketing
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingLead
                  ? "Update Lead"
                  : "Create Lead"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "24px" }}
        >
          <p>{error}</p>
        </div>
      )}

      {/* Lead list */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              SALES PIPELINE
            </p>

            <h3>All Leads</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadLeads}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading leads...</p>}

        {!loading && leads.length === 0 && (
          <p>No leads yet.</p>
        )}

        {!loading && leads.length > 0 && (
          <div>
            {leads.map((lead) => (
              <div
                key={lead.id}
                style={{
                  padding: "20px 0",
                  borderBottom:
                    "1px solid #e5e5e5",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "20px",
                  }}
                >
                  <div>
                    <h2>{lead.name}</h2>

                    <p>
                      {lead.company ||
                        "No company"}
                    </p>

                    <p>{lead.email}</p>

                    <p>
                      {lead.phone ||
                        "No phone number"}
                    </p>

                    <p>
                      Stage:{" "}
                      <strong>
                        {lead.stage}
                      </strong>
                    </p>

                    <p>
                      Response:{" "}
                      {lead.response ||
                        "No response"}
                    </p>

                    <p>
                      Contact attempts:{" "}
                      {lead.contact_attempts}
                    </p>

                    {lead.next_follow_up_at && (
                      <p>
                        Next follow-up:{" "}
                        {new Date(
                          lead.next_follow_up_at
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      alignContent:
                        "flex-start",
                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(lead)
                      }
                    >
                      Edit
                    </button>

                    {lead.stage !== "won" &&
                      lead.stage !==
                        "dropped" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              contactAgain(
                                lead
                              )
                            }
                          >
                            Contact Again
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              markNotNow(
                                lead
                              )
                            }
                          >
                            Not Now
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              markDropped(
                                lead
                              )
                            }
                          >
                            Drop
                          </button>
                        </>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          lead.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}