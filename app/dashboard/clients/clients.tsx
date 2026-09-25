"use client";

import { useEffect, useState } from "react";

import BackToDashboard from "@/components/dashboard/BackToDashboard";

import { useAuth } from "@/lib/auth-context";

type Client = {
  id: number;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: string;
  created_at: string;
};

type ClientForm = {
  name: string;
  email: string;
  company: string;
  phone: string;
};

type EmailForm = {
  subject: string;
  message: string;
  attachments: File[];
};

const emptyForm: ClientForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
};

const emptyEmailForm: EmailForm = {
  subject: "",
  message: "",
  attachments: [],
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export default function ClientsPage() {
  const { userEmail } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  const [form, setForm] =
    useState<ClientForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  // ============================================================
  // EMAIL STATE
  // ============================================================

  const [emailClient, setEmailClient] =
    useState<Client | null>(null);

  const [emailForm, setEmailForm] =
    useState<EmailForm>(emptyEmailForm);

  const [sendingEmail, setSendingEmail] =
    useState(false);

  const [emailError, setEmailError] =
    useState("");

  const [emailSuccess, setEmailSuccess] =
    useState("");

  // ============================================================
  // LOAD CLIENTS
  // ============================================================

  async function loadClients() {
    if (!userEmail) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/clients`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load clients (${response.status})`
        );
      }

      const data: Client[] = await response.json();

      setClients(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load clients"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, [userEmail]);

  // ============================================================
  // ADD / EDIT CLIENT
  // ============================================================

  function openAddForm() {
    setEditingClient(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(client: Client) {
    setEditingClient(client);

    setForm({
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingClient(null);
    setForm(emptyForm);
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // ============================================================
  // SAVE CLIENT
  // ============================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const url = editingClient
        ? `${API_URL}/clients/${editingClient.id}`
        : `${API_URL}/clients`;

      const method = editingClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${
            editingClient ? "update" : "create"
          } client (${response.status})`
        );
      }

      closeForm();

      await loadClients();
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

  // ============================================================
  // DELETE CLIENT
  // ============================================================

  async function handleDelete(clientId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/clients/${clientId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete client (${response.status})`
        );
      }

      await loadClients();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete client"
      );
    }
  }

  // ============================================================
  // EMAIL COMPOSER
  // ============================================================

  function openEmailComposer(client: Client) {
    setEmailClient(client);

    setEmailForm({
      subject: `Following up with ${client.name}`,
      message: "",
      attachments: [],
    });

    setEmailError("");
    setEmailSuccess("");
  }

  function closeEmailComposer() {
    setEmailClient(null);
    setEmailForm(emptyEmailForm);
    setEmailError("");
    setEmailSuccess("");
  }

  function handleEmailChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setEmailForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleAttachmentChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);

    setEmailForm((current) => ({
      ...current,
      attachments: [...current.attachments, ...files],
    }));

    event.target.value = "";
  }

  function removeAttachment(index: number) {
    setEmailForm((current) => ({
      ...current,
      attachments: current.attachments.filter(
        (_, attachmentIndex) => attachmentIndex !== index
      ),
    }));
  }

  async function handleSendEmail(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!emailClient) {
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError("");
      setEmailSuccess("");

      const formData = new FormData();
      formData.append("subject", emailForm.subject);
      formData.append("message", emailForm.message);

      emailForm.attachments.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        `${API_URL}/clients/${emailClient.id}/send-email`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let message = `Failed to send email (${response.status})`;

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      setEmailSuccess("Email sent successfully.");

      setEmailForm(emptyEmailForm);

      await loadClients();
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

  // ============================================================
  // STATUS
  // ============================================================

  function getStatusClass(status: string) {
    const normalizedStatus = status
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `dashboard-status dashboard-status-${normalizedStatus}`;
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
          + Add Client
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
                {editingClient
                  ? "EDIT CLIENT"
                  : "NEW CLIENT"}
              </p>

              <h3>
                {editingClient
                  ? "Edit Client"
                  : "Add Client"}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="dashboard-form-grid">
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
                required
              />

              <input
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="dashboard-form-actions">
              <button
                type="submit"
                className="dashboard-action-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingClient
                  ? "Update Client"
                  : "Create Client"}
              </button>

              <button
                type="button"
                className="dashboard-action-secondary"
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
        <div className="dashboard-panel dashboard-error-panel">
          <p className="dashboard-error">
            {error}
          </p>
        </div>
      )}

      {/* Client list */}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              CLIENT MANAGEMENT
            </p>

            <h3>All Clients</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadClients}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="dashboard-muted">
            Loading clients...
          </p>
        )}

        {!loading && clients.length === 0 && (
          <p className="dashboard-muted">
            No clients yet.
          </p>
        )}

        {!loading && clients.length > 0 && (
          <div className="dashboard-list">

            {clients.map((client) => (
              <div
                key={client.id}
                className="dashboard-list-row"
              >

                <div className="dashboard-list-content">

                  <h2>{client.name}</h2>

                  <p>{client.company}</p>

                  <p>{client.email}</p>

                  <p>{client.phone}</p>

                  <div className="dashboard-list-status">
                    <span
                      className={getStatusClass(
                        client.status
                      )}
                    >
                      {client.status}
                    </span>
                  </div>

                </div>

                <div className="dashboard-list-actions">

                  <button
                    type="button"
                    className="dashboard-action-primary"
                    onClick={() =>
                      openEmailComposer(client)
                    }
                  >
                    Email
                  </button>

                  <button
                    type="button"
                    className="dashboard-action-edit"
                    onClick={() =>
                      openEditForm(client)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="dashboard-action-delete"
                    onClick={() =>
                      handleDelete(client.id)
                    }
                  >
                    Delete
                  </button>

                </div>

                {/* Email composer */}

                {emailClient?.id === client.id && (
                  <div
                    className="dashboard-panel"
                    style={{
                      marginTop: "20px",
                      width: "100%",
                    }}
                  >
                    <div className="dashboard-panel-header">
                      <div>
                        <p className="dashboard-panel-label">
                          EMAIL CLIENT
                        </p>

                        <h3>
                          Send Email
                        </h3>
                      </div>
                    </div>

                    <form onSubmit={handleSendEmail}>

                      <div className="dashboard-form-grid">

                        <input
                          type="email"
                          value={client.email}
                          disabled
                          aria-label="Recipient email"
                        />

                        <input
                          name="subject"
                          placeholder="Subject"
                          value={emailForm.subject}
                          onChange={handleEmailChange}
                          required
                        />

                        <textarea
                          name="message"
                          placeholder="Write your message..."
                          value={emailForm.message}
                          onChange={handleEmailChange}
                          required
                          rows={8}
                          style={{
                            gridColumn: "1 / -1",
                            resize: "vertical",
                          }}
                        />

                        <div
                          style={{
                            gridColumn: "1 / -1",
                          }}
                        >
                          <label
                            htmlFor={`client-email-attachments-${client.id}`}
                            className="dashboard-muted"
                            style={{
                              display: "block",
                              marginBottom: "8px",
                            }}
                          >
                            Attachments
                          </label>

                          <input
                            id={`client-email-attachments-${client.id}`}
                            type="file"
                            multiple
                            onChange={handleAttachmentChange}
                          />

                          {emailForm.attachments.length > 0 && (
                            <div style={{ marginTop: "12px" }}>
                              {emailForm.attachments.map((file, index) => (
                                <div
                                  key={`${file.name}-${index}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    marginBottom: "8px",
                                  }}
                                >
                                  <span>{file.name}</span>

                                  <button
                                    type="button"
                                    className="dashboard-action-delete"
                                    onClick={() =>
                                      removeAttachment(index)
                                    }
                                    disabled={sendingEmail}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                      {emailError && (
                        <div className="dashboard-panel dashboard-error-panel">
                          <p className="dashboard-error">
                            {emailError}
                          </p>
                        </div>
                      )}

                      {emailSuccess && (
                        <div className="dashboard-panel">
                          <p className="dashboard-muted">
                            {emailSuccess}
                          </p>
                        </div>
                      )}

                      <div className="dashboard-form-actions">

                        <button
                          type="submit"
                          className="dashboard-action-primary"
                          disabled={sendingEmail}
                        >
                          {sendingEmail
                            ? "Sending..."
                            : "Send Email"}
                        </button>

                        <button
                          type="button"
                          className="dashboard-action-secondary"
                          onClick={closeEmailComposer}
                          disabled={sendingEmail}
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