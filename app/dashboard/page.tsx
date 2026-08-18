export default function DashboardPage() {
  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">OATLE</div>

        <nav className="dashboard-nav">
          <a href="/dashboard" className="dashboard-nav-item active">
            Overview
          </a>

          <a href="/dashboard/clients" className="dashboard-nav-item">
            Clients
          </a>

          <a href="#" className="dashboard-nav-item">
            Leads
          </a>

          <a href="#" className="dashboard-nav-item">
            Projects
          </a>

          <a href="#" className="dashboard-nav-item">
            Tasks
          </a>

          <a href="#" className="dashboard-nav-item">
            Invoices
          </a>

          <a href="#" className="dashboard-nav-item">
            Services
          </a>

          <a href="#" className="dashboard-nav-item">
            Analytics
          </a>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <a href="#" className="dashboard-nav-item">
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">OATLE TECHNOLOGIES</p>

            <h1>Dashboard</h1>

            <p className="dashboard-subtitle">
              Here's what's happening with your business.
            </p>
          </div>

          <button className="dashboard-profile">VM</button>
        </header>

        {/* Stats */}
        <section className="dashboard-stats">
          <div className="dashboard-card">
            <p>Revenue</p>
            <h2>R0</h2>
            <span>This month</span>
          </div>

          <div className="dashboard-card">
            <p>Active Clients</p>
            <h2>1</h2>
            <span>Currently active</span>
          </div>

          <div className="dashboard-card">
            <p>Open Leads</p>
            <h2>0</h2>
            <span>Needs attention</span>
          </div>

          <div className="dashboard-card">
            <p>Projects</p>
            <h2>0</h2>
            <span>In progress</span>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="dashboard-grid">
          <div className="dashboard-panel dashboard-projects">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-label">WORK</p>
                <h3>Projects</h3>
              </div>

              <button className="dashboard-link">View all</button>
            </div>

            <div className="dashboard-empty">
              <span>01</span>
              <p>No active projects yet.</p>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-label">SALES</p>
                <h3>Lead Pipeline</h3>
              </div>

              <button className="dashboard-link">View all</button>
            </div>

            <div className="lead-pipeline">
              <div>
                <span>New</span>
                <strong>0</strong>
              </div>

              <div>
                <span>Contacted</span>
                <strong>0</strong>
              </div>

              <div>
                <span>Proposal</span>
                <strong>0</strong>
              </div>

              <div>
                <span>Won</span>
                <strong>0</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section */}
        <section className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-label">TODAY</p>
                <h3>Tasks</h3>
              </div>

              <button className="dashboard-link">View all</button>
            </div>

            <div className="dashboard-empty">
              <span>02</span>
              <p>No tasks due today.</p>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-label">ACTIVITY</p>
                <h3>Recent Activity</h3>
              </div>
            </div>

            <div className="dashboard-empty">
              <span>03</span>
              <p>No recent activity.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}