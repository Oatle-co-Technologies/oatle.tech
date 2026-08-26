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

const emptyForm: ClientForm = {
  name: "",
  email: "",
  company: "",
  phone: "",
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
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);

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

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingClient
                  ? "Update Client"
                  : "Create Client"}
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
        <div className="dashboard-panel">
          <p>{error}</p>
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

        {loading && <p>Loading clients...</p>}

        {!loading && clients.length === 0 && (
          <p>No clients yet.</p>
        )}

        {!loading && clients.length > 0 && (
          <div>
            {clients.map((client) => (
              <div
                key={client.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid #e5e5e5",
                }}
              >
                <div>
                  <h2>{client.name}</h2>
                  <p>{client.company}</p>
                  <p>{client.email}</p>
                  <p>{client.phone}</p>
                  <p>{client.status}</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(client)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(client.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}