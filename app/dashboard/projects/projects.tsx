"use client";

import { useEffect, useState } from "react";

type Client = {
  id: number;
  name: string;
  company: string;
};

type Project = {
  id: number;
  client_id: number;
  name: string;
  website: string | null;
  plan: string;
  description: string | null;
  status: string;
  target_date: string | null;
  notes: string | null;
  created_at: string;
};

type ProjectForm = {
  client_id: string;
  name: string;
  website: string;
  plan: string;
  description: string;
  status: string;
  target_date: string;
  notes: string;
};

const emptyForm: ProjectForm = {
  client_id: "",
  name: "",
  website: "",
  plan: "",
  description: "",
  status: "planning",
  target_date: "",
  notes: "",
};

const statuses = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/projects/"
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load projects (${response.status})`
        );
      }

      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/clients/"
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
    }
  }

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  function openAddForm() {
    setEditingProject(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(project: Project) {
    setEditingProject(project);

    setForm({
      client_id: String(project.client_id),
      name: project.name,
      website: project.website ?? "",
      plan: project.plan,
      description: project.description ?? "",
      status: project.status,
      target_date: project.target_date ?? "",
      notes: project.notes ?? "",
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
    setForm(emptyForm);
  }

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
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

      const payload = {
        client_id: Number(form.client_id),
        name: form.name,
        website: form.website || null,
        plan: form.plan,
        description: form.description || null,
        status: form.status,
        target_date: form.target_date || null,
        notes: form.notes || null,
      };

      const url = editingProject
        ? `http://127.0.0.1:8000/projects/${editingProject.id}`
        : "http://127.0.0.1:8000/projects/";

      const method = editingProject ? "PUT" : "POST";

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
            editingProject ? "update" : "create"
          } project (${response.status})`
        );
      }

      closeForm();
      await loadProjects();
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

  async function handleDelete(projectId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete project (${response.status})`
        );
      }

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete project"
      );
    }
  }

  function getClientName(clientId: number) {
    const client = clients.find(
      (item) => item.id === clientId
    );

    if (!client) {
      return `Client #${clientId}`;
    }

    return client.company
      ? `${client.name} — ${client.company}`
      : client.name;
  }

  return (
    <div>
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
          + Add Project
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
                {editingProject
                  ? "EDIT PROJECT"
                  : "NEW PROJECT"}
              </p>

              <h3>
                {editingProject
                  ? "Edit Project"
                  : "Add Project"}
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
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Client
                </option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.company
                      ? `${client.name} — ${client.company}`
                      : client.name}
                  </option>
                ))}
              </select>

              <input
                name="name"
                placeholder="Project Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="website"
                type="url"
                placeholder="Website"
                value={form.website}
                onChange={handleChange}
              />

              <input
                name="plan"
                placeholder="Plan"
                value={form.plan}
                onChange={handleChange}
                required
              />

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <input
                name="target_date"
                type="date"
                value={form.target_date}
                onChange={handleChange}
              />
            </div>

            <textarea
              name="description"
              placeholder="Project Description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%",
                marginTop: "16px",
              }}
            />

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
                  : editingProject
                  ? "Update Project"
                  : "Create Project"}
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

      {/* Project list */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              PROJECT MANAGEMENT
            </p>

            <h3>All Projects</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadProjects}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading projects...</p>}

        {!loading && projects.length === 0 && (
          <p>No projects yet.</p>
        )}

        {!loading && projects.length > 0 && (
          <div>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "24px",
                  alignItems: "start",
                  padding: "20px 0",
                  borderBottom:
                    "1px solid #e5e5e5",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 10px",
                    }}
                  >
                    {project.name}
                  </h2>

                  <p>
                    Client:{" "}
                    {getClientName(project.client_id)}
                  </p>

                  <p>Plan: {project.plan}</p>

                  <p>Status: {project.status}</p>

                  {project.website && (
                    <p>{project.website}</p>
                  )}

                  {project.description && (
                    <p>{project.description}</p>
                  )}

                  {project.target_date && (
                    <p>
                      Target date:{" "}
                      {project.target_date}
                    </p>
                  )}

                  {project.notes && (
                    <p>{project.notes}</p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    paddingTop: "2px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(project)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(project.id)
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