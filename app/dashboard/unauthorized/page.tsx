"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p>

          <h1>Unauthorized</h1>

          <p className="dashboard-subtitle">
            You are not authorized to enter this page.
          </p>
        </div>
      </header>

      <div
        className="dashboard-panel"
        style={{
          marginTop: "24px",
        }}
      >
        <p>
          If you believe this is an error, please contact your
          administrator.
        </p>

        <Link
          href="/dashboard"
          className="dashboard-link"
          style={{
            display: "inline-block",
            marginTop: "16px",
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
