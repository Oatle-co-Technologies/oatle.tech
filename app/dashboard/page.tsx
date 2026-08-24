"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/client";

const API_URL = "http://127.0.0.1:8000";

const ADMIN_EMAIL = "oatle.tchnologies@gmail.com";
const COMMUNICATIONS_EMAIL = "katlegothangwana@gmail.com";

type DashboardProject = {
  id: number;
  name: string;
  status: string;
  target_date: string | null;
};

type DashboardTask = {
  id: number;
  name: string;
  status: string;
  priority: string;
  due_date: string;
  assigned_to: number | null;
};

type RecentActivity = {
  id: number;
  type: string;
  name: string;
  status: string;
  created_at: string;
};

type DashboardData = {
  revenue: number;
  active_clients: number;
  open_leads: number;
  projects_in_progress: number;
  lead_pipeline: {
    new: number;
    contacted: number;
    proposal: number;
    won: number;
  };
  projects: DashboardProject[];
  tasks_due_today: DashboardTask[];
  recent_activity: RecentActivity[];
};

export default function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const result = await authClient.getSession();

        setUserEmail(
          result.data?.user?.email?.toLowerCase() ?? ""
        );
      } catch (err) {
        console.error("Failed to load authenticated user:", err);
      }
    }

    loadUser();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/dashboard/summary`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load dashboard (${response.status})`
        );
      }

      const data: DashboardData =
        await response.json();

      setDashboard(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const isCommunications =
    userEmail === COMMUNICATIONS_EMAIL;

  const isAdmin =
    userEmail === ADMIN_EMAIL;

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          Oatle Technologies
        </div>

        <nav className="dashboard-nav">
          <Link
            href="/dashboard"
            className="dashboard-nav-item active"
          >
            Overview
          </Link>

          <Link
            href="/dashboard/clients"
            className="dashboard-nav-item"
          >
            Clients
          </Link>

          <Link
            href="/dashboard/leads"
            className="dashboard-nav-item"
          >
            Leads
          </Link>

          <Link
            href="/dashboard/projects"
            className="dashboard-nav-item"
          >
            Projects
          </Link>

          <Link
            href="/dashboard/tasks"
            className="dashboard-nav-item"
          >
            Tasks
          </Link>

          {/* Admin-only navigation */}
          {isAdmin && (
            <>
              <Link
                href="/dashboard/staff"
                className="dashboard-nav-item"
              >
                Staff
              </Link>

              <Link
                href="/dashboard/invoices"
                className="dashboard-nav-item"
              >
                Invoices
              </Link>
            </>
          )}
        </nav>

        {/* Admin-only settings */}
        {isAdmin && (
          <div className="dashboard-sidebar-bottom">
            <Link
              href="/dashboard/settings"
              className="dashboard-nav-item"
            >
              Settings
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              OATLE TECHNOLOGIES
            </p>

            <h1>Dashboard</h1>

            <p className="dashboard-subtitle">
              Here's what's happening with your business.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-profile"
          >
            {isCommunications ? "KT" : "VM"}
          </button>
        </header>

        {/* Error */}
        {error && (
          <div
            className="dashboard-panel"
            style={{ marginBottom: "24px" }}
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={loadDashboard}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            className="dashboard-panel"
            style={{ marginBottom: "24px" }}
          >
            <p>Loading dashboard...</p>
          </div>
        )}

        {/* Dashboard */}
        {!loading && dashboard && (
          <>
            {/* Stats */}
            <section className="dashboard-stats">
              <div className="dashboard-card">
                <p>Revenue</p>

                <h2>
                  R
                  {Number(
                    dashboard.revenue
                  ).toLocaleString("en-ZA")}
                </h2>

                <span>This month</span>
              </div>

              <div className="dashboard-card">
                <p>Active Clients</p>

                <h2>
                  {dashboard.active_clients}
                </h2>

                <span>Currently active</span>
              </div>

              <div className="dashboard-card">
                <p>Open Leads</p>

                <h2>
                  {dashboard.open_leads}
                </h2>

                <span>Needs attention</span>
              </div>

              <div className="dashboard-card">
                <p>Projects</p>

                <h2>
                  {dashboard.projects_in_progress}
                </h2>

                <span>In progress</span>
              </div>
            </section>

            {/* Projects + Lead Pipeline */}
            <section className="dashboard-grid">
              <div className="dashboard-panel dashboard-projects">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-label">
                      WORK
                    </p>

                    <h3>Projects</h3>
                  </div>

                  <Link
                    href="/dashboard/projects"
                    className="dashboard-link"
                  >
                    View all
                  </Link>
                </div>

                {dashboard.projects.length === 0 ? (
                  <div className="dashboard-empty">
                    <span>01</span>

                    <p>No projects yet.</p>
                  </div>
                ) : (
                  <div>
                    {dashboard.projects.map(
                      (project) => (
                        <div
                          key={project.id}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "20px",
                            padding:
                              "14px 0",
                            borderBottom:
                              "1px solid #e5e5e5",
                          }}
                        >
                          <div>
                            <strong>
                              {project.name}
                            </strong>

                            <p
                              style={{
                                margin:
                                  "5px 0 0",
                                fontSize:
                                  "13px",
                                color:
                                  "#777",
                              }}
                            >
                              {project.status.replace(
                                "_",
                                " "
                              )}
                            </p>
                          </div>

                          {project.target_date && (
                            <span
                              style={{
                                fontSize:
                                  "13px",
                                color:
                                  "#777",
                              }}
                            >
                              Due{" "}
                              {project.target_date}
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-label">
                      SALES
                    </p>

                    <h3>Lead Pipeline</h3>
                  </div>

                  <Link
                    href="/dashboard/leads"
                    className="dashboard-link"
                  >
                    View all
                  </Link>
                </div>

                <div className="lead-pipeline">
                  <div>
                    <span>New</span>

                    <strong>
                      {dashboard.lead_pipeline.new}
                    </strong>
                  </div>

                  <div>
                    <span>Contacted</span>

                    <strong>
                      {
                        dashboard
                          .lead_pipeline
                          .contacted
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Proposal</span>

                    <strong>
                      {
                        dashboard
                          .lead_pipeline
                          .proposal
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Won</span>

                    <strong>
                      {dashboard.lead_pipeline.won}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Tasks + Recent Activity */}
            <section className="dashboard-grid">
              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-label">
                      TODAY
                    </p>

                    <h3>Tasks</h3>
                  </div>

                  <Link
                    href="/dashboard/tasks"
                    className="dashboard-link"
                  >
                    View all
                  </Link>
                </div>

                {dashboard.tasks_due_today
                  .length === 0 ? (
                  <div className="dashboard-empty">
                    <span>02</span>

                    <p>
                      No tasks due today.
                    </p>
                  </div>
                ) : (
                  <div>
                    {dashboard.tasks_due_today.map(
                      (task) => (
                        <div
                          key={task.id}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "20px",
                            padding:
                              "14px 0",
                            borderBottom:
                              "1px solid #e5e5e5",
                          }}
                        >
                          <div>
                            <strong>
                              {task.name}
                            </strong>

                            <p
                              style={{
                                margin:
                                  "5px 0 0",
                                fontSize:
                                  "13px",
                                color:
                                  "#777",
                              }}
                            >
                              {task.status.replace(
                                "_",
                                " "
                              )}
                            </p>
                          </div>

                          <span
                            style={{
                              fontSize:
                                "13px",
                              fontWeight:
                                600,
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-panel-label">
                      ACTIVITY
                    </p>

                    <h3>
                      Recent Activity
                    </h3>
                  </div>
                </div>

                {dashboard.recent_activity
                  .length === 0 ? (
                  <div className="dashboard-empty">
                    <span>03</span>

                    <p>
                      No recent activity.
                    </p>
                  </div>
                ) : (
                  <div>
                    {dashboard.recent_activity.map(
                      (activity) => (
                        <div
                          key={`${activity.type}-${activity.id}`}
                          style={{
                            padding:
                              "14px 0",
                            borderBottom:
                              "1px solid #e5e5e5",
                          }}
                        >
                          <strong>
                            {activity.name}
                          </strong>

                          <p
                            style={{
                              margin:
                                "5px 0 0",
                              fontSize:
                                "13px",
                              color:
                                "#777",
                            }}
                          >
                            {activity.type} ·{" "}
                            {activity.status.replace(
                              "_",
                              " "
                            )}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}