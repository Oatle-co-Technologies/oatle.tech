"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";

import BackToDashboard from "@/components/dashboard/BackToDashboard";

type StaffMember = {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
  access_level: string;
  employment_type: string;
  is_temporary: boolean;
  active: boolean;
};

type StaffForm = Omit<StaffMember, "id">;

const emptyForm: StaffForm = {
  name: "",
  email: "",
  job_title: "",
  access_level: "member",
  employment_type: "employee",
  is_temporary: false,
  active: true,
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export default function Staff() {
  const { userEmail } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [editingStaff, setEditingStaff] =
    useState<StaffMember | null>(null);

  const [form, setForm] = useState<StaffForm>({
    ...emptyForm,
  });

  const [saving, setSaving] = useState(false);

  async function loadStaff() {
    if (!userEmail) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/staff`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load staff (${response.status})`
        );
      }

      const data: StaffMember[] =
        await response.json();

      setStaff(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load staff"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, [userEmail]);

  function openAddForm() {
    setEditingStaff(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError("");
  }

  function openEditForm(
    member: StaffMember
  ) {
    setEditingStaff(member);

    setForm({
      name: member.name,
      email: member.email,
      job_title: member.job_title ?? "",
      access_level: member.access_level,
      employment_type:
        member.employment_type,
      is_temporary:
        member.is_temporary,
      active: member.active,
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingStaff(null);
    setForm({ ...emptyForm });
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } =
      event.target;

    const checked =
      type === "checkbox" &&
      "checked" in event.target
        ? event.target.checked
        : undefined;

    setForm((current) => ({
      ...current,
      [name]: checked ?? value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const url = editingStaff
        ? `${API_URL}/staff/${editingStaff.id}`
        : `${API_URL}/staff`;

      const method = editingStaff
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          ...form,
          job_title:
            form.job_title || null,
        }),
      });

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to ${
              editingStaff
                ? "update"
                : "create"
            } staff member (${response.status})`
        );
      }

      closeForm();

      await loadStaff();
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

  async function handleDelete(
    staffId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this staff member?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/staff/${staffId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to delete staff member (${response.status})`
        );
      }

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete staff member"
      );
    }
  }

  return (
    <div className="dashboard-page">
      <BackToDashboard />

      {/* Header controls */}

      <div className="dashboard-page-actions">
        <button
          type="button"
          className="dashboard-action-primary"
          onClick={openAddForm}
        >
          + Add Staff Member
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
                {editingStaff
                  ? "EDIT STAFF MEMBER"
                  : "NEW STAFF MEMBER"}
              </p>

              <h3>
                {editingStaff
                  ? "Edit Staff Member"
                  : "Add Staff Member"}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="dashboard-form-grid">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                name="job_title"
                placeholder="Job Title"
                value={
                  form.job_title ?? ""
                }
                onChange={handleChange}
              />

              <select
                name="access_level"
                value={
                  form.access_level
                }
                onChange={handleChange}
              >
                <option value="member">
                  Member
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

              <select
                name="employment_type"
                value={
                  form.employment_type
                }
                onChange={handleChange}
              >
                <option value="employee">
                  Employee
                </option>

                <option value="contractor">
                  Contractor
                </option>

                <option value="intern">
                  Intern
                </option>
              </select>

              <div className="dashboard-checkbox-group">
                <label>
                  <input
                    name="is_temporary"
                    type="checkbox"
                    checked={
                      form.is_temporary
                    }
                    onChange={handleChange}
                  />{" "}
                  Temporary
                </label>

                <label>
                  <input
                    name="active"
                    type="checkbox"
                    checked={form.active}
                    onChange={handleChange}
                  />{" "}
                  Active
                </label>
              </div>
            </div>

            <div className="dashboard-form-actions">
              <button
                type="submit"
                className="dashboard-action-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingStaff
                  ? "Update Staff Member"
                  : "Create Staff Member"}
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

      {/* Staff list */}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              TEAM MANAGEMENT
            </p>

            <h3>All Staff</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadStaff}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="dashboard-muted">
            Loading staff...
          </p>
        )}

        {!loading &&
          staff.length === 0 && (
            <p className="dashboard-muted">
              No staff members yet.
            </p>
          )}

        {!loading &&
          staff.length > 0 &&
          staff.map((member) => (
            <div
              key={member.id}
              className="dashboard-list-row dashboard-staff-row"
            >
              <div className="dashboard-list-content">
                <h2>{member.name}</h2>

                <p>{member.email}</p>

                <p>
                  Role:{" "}
                  {member.job_title ||
                    "Not set"}
                </p>

                <div className="dashboard-status-group">
                  <div className="dashboard-status-item">
                    <span className="dashboard-status-label">
                      Access
                    </span>

                    <span className="dashboard-status dashboard-status-info">
                      {member.access_level}
                    </span>
                  </div>

                  <div className="dashboard-status-item">
                    <span className="dashboard-status-label">
                      Employment
                    </span>

                    <span className="dashboard-status dashboard-status-info">
                      {member.employment_type}
                      {member.is_temporary
                        ? " · Temporary"
                        : ""}
                    </span>
                  </div>

                  <div className="dashboard-status-item">
                    <span className="dashboard-status-label">
                      Status
                    </span>

                    <span
                      className={
                        member.active
                          ? "dashboard-status dashboard-status-active"
                          : "dashboard-status dashboard-status-inactive"
                      }
                    >
                      {member.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dashboard-list-actions">
                <button
                  type="button"
                  className="dashboard-action-edit"
                  onClick={() =>
                    openEditForm(
                      member
                    )
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="dashboard-action-delete"
                  onClick={() =>
                    handleDelete(
                      member.id
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}