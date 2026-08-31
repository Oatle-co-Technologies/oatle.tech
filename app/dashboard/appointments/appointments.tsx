"use client";

import { useEffect, useMemo, useState } from "react";
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

const API_URL = "/api/backend/appointments";

export default function Appointments() {
  const { staff, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    async function loadAppointments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to load appointments");
        }

        const data: Appointment[] = await response.json();
        setAppointments(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load appointments"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadAppointments();
  }, [authLoading]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments.filter(
      (appointment) =>
        appointment.status !== "cancelled" &&
        new Date(appointment.start_time) >= now
    );
  }, [appointments]);

  const sentAppointments = useMemo(() => {
    if (!staff?.id) return [];

    return appointments.filter(
      (appointment) => appointment.organizer_staff_id === staff.id
    );
  }, [appointments, staff?.id]);

  const receivedAppointments = useMemo(() => {
    if (!staff?.id) return [];

    return appointments.filter(
      (appointment) =>
        appointment.organizer_staff_id !== staff.id &&
        appointment.status !== "cancelled"
    );
  }, [appointments, staff?.id]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading appointments...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage your meetings and appointment bookings.
          </p>
        </div>

        <button
          type="button"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          New Appointment
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">Upcoming</p>

          <p className="mt-2 text-3xl font-semibold">
            {upcomingAppointments.length}
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">
            Appointments Sent
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {sentAppointments.length}
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">
            Appointments Received
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {receivedAppointments.length}
          </p>
        </div>
      </div>

      {/* Upcoming */}
      <div className="rounded-lg border">
        <div className="border-b p-5">
          <h2 className="font-semibold">Upcoming Appointments</h2>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming appointments.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-medium">{appointment.title}</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.participant_name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {appointment.participant_email}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(
                      appointment.start_time
                    ).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      appointment.start_time
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}