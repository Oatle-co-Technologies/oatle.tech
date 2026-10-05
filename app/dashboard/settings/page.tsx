"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { authClient } from "@/lib/auth/client";
import BackToDashboard from "@/components/dashboard/BackToDashboard";

export default function SettingsPage() {
  const { staff, userEmail, updateStaffName } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!staff) return null;
  const currentName = name ?? staff.name;

  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !currentName.trim()) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/backend/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentName.trim() }),
      });
      if (!response.ok) throw new Error("Unable to save your name. Please try again.");
      const profile: { name: string } = await response.json();
      updateStaffName(profile.name);
      setName(profile.name);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your name.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Unable to sign out. Please try again.");
      window.location.assign(new URL("/login", window.location.origin).href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
      setSigningOut(false);
    }
  }

  return (
    <main className="dashboard-main">
      <BackToDashboard />
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p>
          <h1>Settings</h1>
          <p className="dashboard-subtitle">Manage your profile and account.</p>
        </div>
      </header>
      {error && <p role="alert">{error}</p>}
      <section className="dashboard-panel dashboard-form-panel">
        <h2>My Profile</h2>
        <form onSubmit={saveName}>
          <div className="dashboard-form-grid">
            <label className="dashboard-form-field">
              Name
              <input type="text" autoComplete="name" required value={currentName}
                disabled={saving || signingOut}
                onChange={(event) => { setName(event.target.value); setSaved(false); }} />
            </label>
            <label className="dashboard-form-field">
              Email
              <input type="email" autoComplete="email" value={userEmail || staff.email} readOnly />
            </label>
          </div>
          <div className="dashboard-form-actions">
            <button type="submit" disabled={saving || signingOut || !currentName.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {saved && <p role="status">Your name has been saved.</p>}
          </div>
        </form>
      </section>
      <section className="dashboard-panel" style={{ marginTop: "24px" }}>
        <h2>Account</h2>
        <button type="button" onClick={signOut} disabled={signingOut || saving}>
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </section>
    </main>
  );
}
