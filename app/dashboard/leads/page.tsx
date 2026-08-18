import LeadsPage from "./leads";

export default function Page() {
  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            OATLE TECHNOLOGIES
          </p>

          <h1>Leads</h1>

          <p className="dashboard-subtitle">
            Manage your sales pipeline and follow-ups.
          </p>
        </div>
      </header>

      <LeadsPage />
    </main>
  );
}