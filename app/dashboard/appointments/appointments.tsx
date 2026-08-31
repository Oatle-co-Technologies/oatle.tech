"use client";

import { useEffect, useState } from "react";

import BackToDashboard from "@/components/dashboard/BackToDashboard";
import { useAuth } from "@/lib/auth-context";

type Appointment = {
  id: number;
  organizer_staff_id: number | null;
  participant_staff_id: number | null;
  participant_name: string;
  participant_email: string;
  title: string;
  appointment_type: string;
  start_time: string;
  end_time: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AppointmentForm = {
  participant_name: string;
  participant_email: string;
  title: string;
  appointment_type: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
};

const emptyForm: AppointmentForm = {
  participant_name: "",
  participant_email: "",
  title: "",
  appointment_type: "general",
  start_time: "",
  end_time: "",
  location: "",
  notes: "",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export default function AppointmentsPage() {
  const { staff, userEmail } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  const [form, setForm] =
    useState<AppointmentForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  async function loadAppointments() {
    if (!userEmail) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/appointments`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load appointments (${response.status})`
        );
      }

      const data: Appointment[] = await response.json();

      setAppointments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load appointments"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointments();
  }, [userEmail]);

  function openAddForm() {
    setEditingAppointment(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(
    appointment: Appointment
  ) {
    setEditingAppointment(appointment);

    setForm({
      participant_name:
        appointment.participant_name,
      participant_email:
        appointment.participant_email,
      title: appointment.title,
      appointment_type:
        appointment.appointment_type,
      start_time: appointment.start_time.slice(0, 16),
      end_time: appointment.end_time.slice(0, 16),
      location:
        appointment.location || "",
      notes:
        appointment.notes || "",
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingAppointment(null);
    setForm(emptyForm);
  }

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
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
        organizer_staff_id:
          staff?.id ?? null,
        participant_staff_id: null,
        participant_name:
          form.participant_name,
        participant_email:
          form.participant_email,
        title: form.title,
        appointment_type:
          form.appointment_type,
        start_time: form.start_time,
        end_time: form.end_time,
        location:
          form.location || null,
        notes:
          form.notes || null,
      };

      const url = editingAppointment
        ? `${API_URL}/appointments/${editingAppointment.id}`
        : `${API_URL}/appointments`;

      const method = editingAppointment
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail ||
            `Failed to ${
              editingAppointment
                ? "update"
                : "create"
            } appointment (${response.status})`
        );
      }

      closeForm();

      await loadAppointments();
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
    appointmentId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete appointment (${response.status})`
        );
      }

      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete appointment"
      );
    }
  }

  function getStatusClass(status: string) {
    const normalizedStatus = status
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `dashboard-status dashboard-status-${normalizedStatus}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(
      "en-ZA",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function isUpcoming(
    appointment: Appointment
  ) {
    return (
      appointment.status !== "cancelled" &&
      new Date(appointment.start_time) >=
        new Date()
    );
  }

  function isReceived(
    appointment: Appointment
  ) {
    return (
      staff?.id != null &&
      appointment.organizer_staff_id !==
        staff.id
    );
  }

  const upcomingAppointments =
    appointments.filter(isUpcoming);

  const sentAppointments =
    appointments.filter(
      (appointment) =>
        appointment.organizer_staff_id ===
        staff?.id
    );

  const receivedAppointments =
    appointments.filter(isReceived);

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
          + New Appointment
        </button>
      </div>

      {/* Appointment form */}
      {showForm && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "24px" }}
        >
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                {editingAppointment
                  ? "EDIT APPOINTMENT"
                  : "NEW APPOINTMENT"}
              </p>

              <h3>
                {editingAppointment
                  ? "Edit Appointment"
                  : "Create Appointment"}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="dashboard-form-grid">
              <input
                name="participant_name"
                placeholder="Participant name"
                value={
                  form.participant_name
                }
                onChange={handleChange}
                required
              />

              <input
                name="participant_email"
                type="email"
                placeholder="Participant email"
                value={
                  form.participant_email
                }
                onChange={handleChange}
                required
              />

              <input
                name="title"
                placeholder="Appointment title"
                value={form.title}
                onChange={handleChange}
                required
              />

              <select
                name="appointment_type"
                value={
                  form.appointment_type
                }
                onChange={handleChange}
              >
                <option value="general">
                  General
                </option>

                <option value="discovery">
                  Discovery Call
                </option>

                <option value="consultation">
                  Consultation
                </option>

                <option value="meeting">
                  Meeting
                </option>
              </select>

              <input
                name="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={handleChange}
                required
              />

              <input
                name="end_time"
                type="datetime-local"
                value={form.end_time}
                onChange={handleChange}
                required
              />

              <input
                name="location"
                placeholder="Location or meeting link"
                value={form.location}
                onChange={handleChange}
              />

              <textarea
                name="notes"
                placeholder="Notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
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
                  : editingAppointment
                  ? "Update Appointment"
                  : "Create Appointment"}
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

      {/* Upcoming appointments */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              APPOINTMENTS
            </p>

            <h3>
              Upcoming Appointments
            </h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadAppointments}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="dashboard-muted">
            Loading appointments...
          </p>
        )}

        {!loading &&
          upcomingAppointments.length ===
            0 && (
            <p className="dashboard-muted">
              No upcoming appointments.
            </p>
          )}

        {!loading &&
          upcomingAppointments.length >
            0 && (
            <div className="dashboard-list">
              {upcomingAppointments.map(
                (appointment) => (
                  <div
                    key={appointment.id}
                    className="dashboard-list-row"
                  >
                    <div className="dashboard-list-content">
                      <h2>
                        {appointment.title}
                      </h2>

                      <p>
                        {
                          appointment.participant_name
                        }
                      </p>

                      <p>
                        {
                          appointment.participant_email
                        }
                      </p>

                      <p>
                        {formatDate(
                          appointment.start_time
                        )}{" "}
                        ·{" "}
                        {formatTime(
                          appointment.start_time
                        )}{" "}
                        -{" "}
                        {formatTime(
                          appointment.end_time
                        )}
                      </p>

                      {appointment.location && (
                        <p>
                          {
                            appointment.location
                          }
                        </p>
                      )}

                      <div className="dashboard-list-status">
                        <span
                          className={getStatusClass(
                            appointment.status
                          )}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>

                    <div className="dashboard-list-actions">
                      <button
                        type="button"
                        className="dashboard-action-edit"
                        onClick={() =>
                          openEditForm(
                            appointment
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
                            appointment.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </div>

      {/* Sent appointments */}
      <div
        className="dashboard-panel"
        style={{ marginTop: "24px" }}
      >
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              COMMUNICATION
            </p>

            <h3>
              Appointments Sent
            </h3>
          </div>
        </div>

        {sentAppointments.length === 0 ? (
          <p className="dashboard-muted">
            No appointments sent yet.
          </p>
        ) : (
          <div className="dashboard-list">
            {sentAppointments.map(
              (appointment) => (
                <div
                  key={appointment.id}
                  className="dashboard-list-row"
                >
                  <div className="dashboard-list-content">
                    <h2>
                      {appointment.title}
                    </h2>

                    <p>
                      {
                        appointment.participant_name
                      }
                    </p>

                    <p>
                      {formatDate(
                        appointment.start_time
                      )}{" "}
                      ·{" "}
                      {formatTime(
                        appointment.start_time
                      )}
                    </p>
                  </div>

                  <div className="dashboard-list-actions">
                    <button
                      type="button"
                      className="dashboard-action-edit"
                      onClick={() =>
                        openEditForm(
                          appointment
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
                          appointment.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Received appointments */}
      <div
        className="dashboard-panel"
        style={{ marginTop: "24px" }}
      >
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              BOOKINGS
            </p>

            <h3>
              Appointments Received
            </h3>
          </div>
        </div>

        {receivedAppointments.length ===
        0 ? (
          <p className="dashboard-muted">
            No appointments received yet.
          </p>
        ) : (
          <div className="dashboard-list">
            {receivedAppointments.map(
              (appointment) => (
                <div
                  key={appointment.id}
                  className="dashboard-list-row"
                >
                  <div className="dashboard-list-content">
                    <h2>
                      {appointment.title}
                    </h2>

                    <p>
                      {
                        appointment.participant_name
                      }
                    </p>

                    <p>
                      {
                        appointment.participant_email
                      }
                    </p>

                    <p>
                      {formatDate(
                        appointment.start_time
                      )}{" "}
                      ·{" "}
                      {formatTime(
                        appointment.start_time
                      )}
                    </p>

                    <div className="dashboard-list-status">
                      <span
                        className={getStatusClass(
                          appointment.status
                        )}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-list-actions">
                    <button
                      type="button"
                      className="dashboard-action-edit"
                      onClick={() =>
                        openEditForm(
                          appointment
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
                          appointment.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}