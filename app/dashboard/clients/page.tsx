import ClientsPage from "./clients";

export default function Page() {
  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p>

          <h1>Clients</h1>

          <p className="dashboard-subtitle">
            Manage your clients and their information.
          </p>
        </div>
      </header>

      <ClientsPage />
    </main>
  );
}