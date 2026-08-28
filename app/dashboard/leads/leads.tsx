"use client";

import { useEffect, useState } from "react";
import BackToDashboard from "@/components/dashboard/BackToDashboard";
import { useAuth } from "@/lib/auth-context";

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

type EmailForm = {
  subject: string;
  message: string;
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

const emptyEmailForm: EmailForm = {
  subject: "",
  message: "",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export default function LeadsPage() {
  const { userEmail } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingLead, setEditingLead] =
    useState<Lead | null>(null);

  const [form, setForm] =
    useState<LeadForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  // ----------------------------------------------------------
  // Email composer state
  // ----------------------------------------------------------

  const [emailLead, setEmailLead] =
    useState<Lead | null>(null);

  const [emailForm, setEmailForm] =
    useState<EmailForm>(emptyEmailForm);

  const [sendingEmail, setSendingEmail] =
    useState(false);

  const [emailError, setEmailError] =
    useState("");

  const [emailSuccess, setEmailSuccess] =
    useState("");

  // ----------------------------------------------------------
  // Load leads
  // ----------------------------------------------------------

  async function loadLeads() {
    if (!userEmail) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/leads`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load leads (${response.status})`
        );
      }

      const data: Lead[] =
        await response.json();

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
  }, [userEmail]);

  // ----------------------------------------------------------
  // Add / edit lead
  // ----------------------------------------------------------

  function openAddForm() {
    setEditingLead(null);
    setForm({ ...emptyForm });
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
      contact_attempts:
        lead.contact_attempts ?? 0,
      last_contacted_at:
        lead.last_contacted_at
          ? new Date(
              lead.last_contacted_at
            )
              .toISOString()
              .slice(0, 16)
          : "",
      next_follow_up_at:
        lead.next_follow_up_at
          ? new Date(
              lead.next_follow_up_at
            )
              .toISOString()
              .slice(0, 16)
          : "",
      notes: lead.notes ?? "",
      marketing_email_opt_in:
        lead.marketing_email_opt_in ??
        false,
      marketing_sms_opt_in:
        lead.marketing_sms_opt_in ??
        false,
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingLead(null);
    setForm({ ...emptyForm });
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >
  ) {
    const { name, value } =
      event.target;

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
    const { name, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  function buildPayload(
    formData: LeadForm
  ) {
    return {
      name: formData.name,
      email: formData.email,
      company:
        formData.company || null,
      phone:
        formData.phone || null,
      source:
        formData.source || null,
      stage: formData.stage,
      response:
        formData.response || null,
      follow_up_reason:
        formData.follow_up_reason ||
        null,
      contact_attempts: Number(
        formData.contact_attempts
      ),
      last_contacted_at:
        formData.last_contacted_at
          ? new Date(
              formData.last_contacted_at
            ).toISOString()
          : null,
      next_follow_up_at:
        formData.next_follow_up_at
          ? new Date(
              formData.next_follow_up_at
            ).toISOString()
          : null,
      notes:
        formData.notes || null,
      marketing_email_opt_in:
        formData.marketing_email_opt_in,
      marketing_sms_opt_in:
        formData.marketing_sms_opt_in,
    };
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload =
        buildPayload(form);

      const url = editingLead
        ? `${API_URL}/leads/${editingLead.id}`
        : `${API_URL}/leads`;

      const method = editingLead
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const errorData =
            await response.json();

          if (
            typeof errorData?.detail ===
            "string"
          ) {
            detail = `: ${errorData.detail}`;
          }
        } catch {
          // Ignore malformed error responses.
        }

        throw new Error(
          `Failed to ${
            editingLead
              ? "update"
              : "create"
          } lead (${response.status})${detail}`
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

  // ----------------------------------------------------------
  // Generic lead update
  // ----------------------------------------------------------

  async function updateLead(
    lead: Lead,
    changes: Partial<Lead>
  ) {
    try {
      setError("");

      const updatedLead: Lead = {
        ...lead,
        ...changes,
      };

      const payload = {
        name: updatedLead.name,
        email: updatedLead.email,
        company:
          updatedLead.company,
        phone: updatedLead.phone,
        source:
          updatedLead.source,
        stage:
          updatedLead.stage,
        response:
          updatedLead.response,
        follow_up_reason:
          updatedLead.follow_up_reason,
        contact_attempts:
          updatedLead.contact_attempts,
        last_contacted_at:
          updatedLead.last_contacted_at,
        next_follow_up_at:
          updatedLead.next_follow_up_at,
        notes:
          updatedLead.notes,
        marketing_email_opt_in:
          updatedLead.marketing_email_opt_in,
        marketing_sms_opt_in:
          updatedLead.marketing_sms_opt_in,
      };

      const response = await fetch(
        `${API_URL}/leads/${lead.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const errorData =
            await response.json();

          if (
            typeof errorData?.detail ===
            "string"
          ) {
            detail = `: ${errorData.detail}`;
          }
        } catch {
          // Ignore malformed error responses.
        }

        throw new Error(
          `Failed to update lead (${response.status})${detail}`
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

  async function contactAgain(
    lead: Lead
  ) {
    await updateLead(lead, {
      stage: "contacted",
      contact_attempts:
        lead.contact_attempts + 1,
      last_contacted_at:
        new Date().toISOString(),
    });
  }

  async function markNotNow(
    lead: Lead
  ) {
    await updateLead(lead, {
      stage: "not_now",
      response: "not_now",
    });
  }

  async function markDropped(
    lead: Lead
  ) {
    const confirmed =
      window.confirm(
        `Drop ${lead.name} from the active pipeline?`
      );

    if (!confirmed) {
      return;
    }

    await updateLead(lead, {
      stage: "dropped",
    });
  }

  // ----------------------------------------------------------
  // Email composer
  // ----------------------------------------------------------

  function openEmailComposer(
    lead: Lead
  ) {
    setEmailLead(lead);

    setEmailForm({
      subject: `Following up with ${lead.name}`,
      message: "",
    });

    setEmailError("");
    setEmailSuccess("");
  }

  function closeEmailComposer() {
    if (sendingEmail) {
      return;
    }

    setEmailLead(null);
    setEmailForm({
      ...emptyEmailForm,
    });

    setEmailError("");
    setEmailSuccess("");
  }

  function handleEmailChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement
    >
  ) {
    const { name, value } =
      event.target;

    setEmailForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSendEmail(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!emailLead) {
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError("");
      setEmailSuccess("");

      const response = await fetch(
        `${API_URL}/leads/${emailLead.id}/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            subject:
              emailForm.subject,
            message:
              emailForm.message,
          }),
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const errorData =
            await response.json();

          if (
            typeof errorData?.detail ===
            "string"
          ) {
            detail = `: ${errorData.detail}`;
          }
        } catch {
          // Ignore malformed error responses.
        }

        throw new Error(
          `Failed to send email (${response.status})${detail}`
        );
      }

      setEmailSuccess(
        "Email sent successfully."
      );

      setEmailForm({
        ...emptyEmailForm,
      });

      await loadLeads();
    } catch (err) {
      setEmailError(
        err instanceof Error
          ? err.message
          : "Failed to send email"
      );
    } finally {
      setSendingEmail(false);
    }
  }

  // ----------------------------------------------------------
  // Delete lead
  // ----------------------------------------------------------

  async function handleDelete(
    leadId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this lead?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/leads/${leadId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const errorData =
            await response.json();

          if (
            typeof errorData?.detail ===
            "string"
          ) {
            detail = `: ${errorData.detail}`;
          }
        } catch {
          // Ignore malformed error responses.
        }

        throw new Error(
          `Failed to delete lead (${response.status})${detail}`
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

  // ----------------------------------------------------------
  // Status helpers
  // ----------------------------------------------------------

  function getStatusClass(
    status: string
  ) {
    const normalizedStatus =
      status
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `dashboard-status dashboard-status-${normalizedStatus}`;
  }

  function formatStatus(
    status: string
  ) {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return (
    <div className="dashboard-page">
      <BackToDashboard />

      {/* Header controls */}

      <div className="dashboard-page-actions">
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
          style={{
            marginBottom: "24px",
          }}
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
            <div className="dashboard-form-grid">
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={
                  handleChange
                }
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={
                  handleChange
                }
                required
              />

              <input
                name="company"
                placeholder="Company"
                value={
                  form.company
                }
                onChange={
                  handleChange
                }
              />

              <input
                name="phone"
                placeholder="Phone"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
              />

              <input
                name="source"
                placeholder="Source"
                value={
                  form.source
                }
                onChange={
                  handleChange
                }
              />

              <select
                name="stage"
                value={
                  form.stage
                }
                onChange={
                  handleChange
                }
              >
                <option value="new">
                  New
                </option>

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

                <option value="won">
                  Won
                </option>

                <option value="dropped">
                  Dropped
                </option>
              </select>

              <select
                name="response"
                value={
                  form.response
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  No response recorded
                </option>

                <option value="yes">
                  Yes / Interested
                </option>

                <option value="no">
                  No
                </option>

                <option value="not_now">
                  Not Now
                </option>
              </select>

              <input
                name="follow_up_reason"
                placeholder="Follow-up reason"
                value={
                  form.follow_up_reason
                }
                onChange={
                  handleChange
                }
              />

              <input
                name="contact_attempts"
                type="number"
                min="0"
                placeholder="Contact attempts"
                value={
                  form.contact_attempts
                }
                onChange={
                  handleChange
                }
              />

              <label className="dashboard-form-field">
                Last contacted

                <input
                  name="last_contacted_at"
                  type="datetime-local"
                  value={
                    form.last_contacted_at
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

              <label className="dashboard-form-field">
                Next follow-up

                <input
                  name="next_follow_up_at"
                  type="datetime-local"
                  value={
                    form.next_follow_up_at
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>
            </div>

            <textarea
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={
                handleChange
              }
              rows={4}
              className="dashboard-form-textarea"
            />

            <div className="dashboard-checkbox-group">
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

            <div className="dashboard-form-actions">
              <button
                type="submit"
                className="dashboard-action-primary"
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
                className="dashboard-action-secondary"
                onClick={
                  closeForm
                }
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
        <div className="dashboard-panel dashboard-error-panel">
          <p className="dashboard-error">
            {error}
          </p>
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

        {loading && (
          <p className="dashboard-muted">
            Loading leads...
          </p>
        )}

        {!loading &&
          leads.length === 0 && (
            <p className="dashboard-muted">
              No leads yet.
            </p>
          )}

        {!loading &&
          leads.length > 0 && (
            <div>
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="dashboard-list-row dashboard-lead-row"
                >
                  <div className="dashboard-list-content">
                    <h2>{lead.name}</h2>

                    <p>
                      {lead.company ||
                        "No company"}
                    </p>

                    <p>
                      {lead.email}
                    </p>

                    <p>
                      {lead.phone ||
                        "No phone number"}
                    </p>

                    <div className="dashboard-status-group">
                      <div className="dashboard-status-item">
                        <span className="dashboard-status-label">
                          Stage
                        </span>

                        <span
                          className={getStatusClass(
                            lead.stage
                          )}
                        >
                          {formatStatus(
                            lead.stage
                          )}
                        </span>
                      </div>

                      <div className="dashboard-status-item">
                        <span className="dashboard-status-label">
                          Response
                        </span>

                        {lead.response ? (
                          <span
                            className={getStatusClass(
                              lead.response
                            )}
                          >
                            {formatStatus(
                              lead.response
                            )}
                          </span>
                        ) : (
                          <span className="dashboard-status dashboard-status-neutral">
                            No response
                          </span>
                        )}
                      </div>
                    </div>

                    <p>
                      Contact attempts:{" "}
                      {
                        lead.contact_attempts
                      }
                    </p>

                    {lead.next_follow_up_at && (
                      <p>
                        Next follow-up:{" "}
                        {new Date(
                          lead.next_follow_up_at
                        ).toLocaleString()}
                      </p>
                    )}

                    {lead.follow_up_reason && (
                      <p>
                        Follow-up reason:{" "}
                        {
                          lead.follow_up_reason
                        }
                      </p>
                    )}

                    {lead.source && (
                      <p>
                        Source:{" "}
                        {lead.source}
                      </p>
                    )}

                    {lead.notes && (
                      <p>
                        {lead.notes}
                      </p>
                    )}
                  </div>

                  <div className="dashboard-list-actions">
                    <button
                      type="button"
                      className="dashboard-action-edit"
                      onClick={() =>
                        openEditForm(
                          lead
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="dashboard-action-primary"
                      onClick={() =>
                        openEmailComposer(
                          lead
                        )
                      }
                    >
                      Email Follow-Up
                    </button>

                    {lead.stage !==
                      "won" &&
                      lead.stage !==
                        "dropped" && (
                        <>
                          <button
                            type="button"
                            className="dashboard-action-primary"
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
                            className="dashboard-action-secondary"
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
                            className="dashboard-action-delete"
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
                      className="dashboard-action-delete"
                      onClick={() =>
                        handleDelete(
                          lead.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>

                  {/* Email composer */}

                  {emailLead?.id ===
                    lead.id && (
                    <div className="dashboard-inline-panel">
                      <div className="dashboard-panel-header">
                        <div>
                          <p className="dashboard-panel-label">
                            CLIENT COMMUNICATION
                          </p>

                          <h3>
                            Email Follow-Up
                          </h3>
                        </div>
                      </div>

                      <form
                        onSubmit={
                          handleSendEmail
                        }
                      >
                        <div className="dashboard-form-field">
                          <label htmlFor={`email-to-${lead.id}`}>
                            To
                          </label>

                          <input
                            id={`email-to-${lead.id}`}
                            type="email"
                            value={
                              emailLead.email
                            }
                            disabled
                          />
                        </div>

                        <div className="dashboard-form-field">
                          <label htmlFor={`email-subject-${lead.id}`}>
                            Subject
                          </label>

                          <input
                            id={`email-subject-${lead.id}`}
                            name="subject"
                            type="text"
                            placeholder="Email subject"
                            value={
                              emailForm.subject
                            }
                            onChange={
                              handleEmailChange
                            }
                            required
                            disabled={
                              sendingEmail
                            }
                          />
                        </div>

                        <div className="dashboard-form-field">
                          <label htmlFor={`email-message-${lead.id}`}>
                            Message
                          </label>

                          <textarea
                            id={`email-message-${lead.id}`}
                            name="message"
                            placeholder="Write your follow-up email..."
                            value={
                              emailForm.message
                            }
                            onChange={
                              handleEmailChange
                            }
                            required
                            disabled={
                              sendingEmail
                            }
                            rows={8}
                          />
                        </div>

                        {emailError && (
                          <div className="dashboard-feedback dashboard-feedback-error">
                            {emailError}
                          </div>
                        )}

                        {emailSuccess && (
                          <div className="dashboard-feedback dashboard-feedback-success">
                            {emailSuccess}
                          </div>
                        )}

                        <div className="dashboard-form-actions">
                          <button
                            type="submit"
                            className="dashboard-action-primary"
                            disabled={
                              sendingEmail
                            }
                          >
                            {sendingEmail
                              ? "Sending..."
                              : "Send Email"}
                          </button>

                          <button
                            type="button"
                            className="dashboard-action-secondary"
                            onClick={
                              closeEmailComposer
                            }
                            disabled={
                              sendingEmail
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}