"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

const greetingMessages = [
  "I hope you're having a great day. Let's get to work.",
  "Good to see you. Let's make some progress today.",
  "Welcome back. You've got this — let's get things moving.",
  "Ready when you are. Let's make today count.",
  "Good to have you back. Let's build something great today.",
];

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
  revenue?: number;
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

const navigationItems = [
  {
    href: "/dashboard",
    label: "Overview",
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
  },
  {
    href: "/dashboard/leads",
    label: "Leads",
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
  },
  {
    href: "/dashboard/staff",
    label: "Staff",
  },
  {
    href: "/dashboard/invoices",
    label: "Invoices",
  },
];

export default function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [userEmail, setUserEmail] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [displayNameInput, setDisplayNameInput] =
    useState("");

  const [showNameSetup, setShowNameSetup] =
    useState(false);

  const [savingName, setSavingName] =
    useState(false);

  const [greetingMessage, setGreetingMessage] =
    useState(greetingMessages[0]);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  function handleSaveDisplayName(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = displayNameInput.trim();

    if (!name || !userEmail) {
      return;
    }

    try {
      setSavingName(true);

      window.localStorage.setItem(
        `oatle-display-name:${userEmail}`,
        name
      );

      setDisplayName(name);
      setShowNameSetup(false);
      setDisplayNameInput("");
    } finally {
      setSavingName(false);
    }
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  async function loadDashboard() {
    try {
      setDashboardLoading(true);
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
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    async function loadSession() {
      try {
        const result =
          await authClient.getSession();

        const email =
          result.data?.user?.email
            ?.toLowerCase()
            .trim() || "";

        setUserEmail(email);
      } catch {
        setUserEmail("");
      } finally {
        setAuthLoading(false);
      }
    }

    void loadSession();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadDashboard();
  }, [authLoading]);

  useEffect(() => {
    if (!userEmail) {
      return;
    }

    const savedName =
      window.localStorage.getItem(
        `oatle-display-name:${userEmail}`
      );

    if (savedName) {
      setDisplayName(savedName);
    } else {
      setShowNameSetup(true);
    }
  }, [userEmail]);

  useEffect(() => {
    const randomIndex = Math.floor(
      Math.random() * greetingMessages.length
    );

    setGreetingMessage(
      greetingMessages[randomIndex]
    );
  }, []);

  return (
    <div className="dashboard">
      {/* Mobile Header */}
      <div className="dashboard-mobile-header">
        <div className="dashboard-logo">
          Oatle Technologies
        </div>

        <button
          type="button"
          className="dashboard-mobile-menu-button"
          onClick={() =>
            setMobileNavOpen(
              (current) => !current
            )
          }
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-mobile-nav"
        >
          {mobileNavOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${
          mobileNavOpen
            ? "dashboard-sidebar-mobile-open"
            : ""
        }`}
      >
        <div className="dashboard-logo">
          Oatle Technologies
        </div>

        <nav
          id="dashboard-mobile-nav"
          className="dashboard-nav"
        >
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard-nav-item ${
                item.href === "/dashboard"
                  ? "active"
                  : ""
              }`}
              onClick={closeMobileNav}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link
            href="/dashboard/settings"
            className="dashboard-nav-item"
            onClick={closeMobileNav}
          >
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">
              OATLE TECHNOLOGIES
            </p>

            {displayName && (
              <h1 className="dashboard-greeting">
                Hello {displayName},
              </h1>
            )}

            <p className="dashboard-subtitle">
              {greetingMessage}
            </p>
          </div>
        </header>

        {showNameSetup && (
          <section
            className="dashboard-panel"
            style={{
              marginBottom: "24px",
              padding: "32px",
            }}
          >
            <p className="dashboard-panel-label">
              WELCOME TO OATLE
            </p>

            <h2
              style={{
                marginTop: "8px",
                marginBottom: "8px",
              }}
            >
              What would you like us to call you?
            </h2>

            <p
              style={{
                marginBottom: "24px",
                color: "#777",
              }}
            >
              Choose the name you'd like to use
              inside your Oatle dashboard.
            </p>

            <form
              onSubmit={handleSaveDisplayName}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  maxWidth: "600px",
                }}
              >
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(event) =>
                    setDisplayNameInput(
                      event.target.value
                    )
                  }
                  placeholder="Display name"
                  autoFocus
                  required
                  style={{
                    flex: 1,
                  }}
                />

                <button
                  type="submit"
                  disabled={savingName}
                >
                  {savingName
                    ? "Saving..."
                    : "Continue"}
                </button>
              </div>
            </form>
          </section>
        )}

        {error && (
          <div
            className="dashboard-panel"
            style={{
              marginBottom: "24px",
            }}
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadDashboard()}
            >
              Try Again
            </button>
          </div>
        )}

        {dashboardLoading && (
          <div
            className="dashboard-panel"
            style={{
              marginBottom: "24px",
            }}
          >
            <p>Loading dashboard...</p>
          </div>
        )}

        {!dashboardLoading && dashboard && (
          <>
            <section className="dashboard-stats">
              <div className="dashboard-card">
                <p>Revenue</p>

                <h2>
                  R
                  {Number(
                    dashboard.revenue ?? 0
                  ).toLocaleString("en-ZA")}
                </h2>

                <span>This month</span>
              </div>

              <div className="dashboard-card">
                <p>Active Clients</p>

                <h2>
                  {dashboard.active_clients}
                </h2>

                <span>
                  Currently active
                </span>
              </div>

              <div className="dashboard-card">
                <p>Open Leads</p>

                <h2>
                  {dashboard.open_leads}
                </h2>

                <span>
                  Needs attention
                </span>
              </div>

              <div className="dashboard-card">
                <p>Projects</p>

                <h2>
                  {dashboard.projects_in_progress}
                </h2>

                <span>In progress</span>
              </div>
            </section>

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

                {dashboard.projects.length ===
                0 ? (
                  <div className="dashboard-empty">
                    <span>01</span>

                    <p>
                      No projects yet.
                    </p>
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

                    <h3>
                      Lead Pipeline
                    </h3>
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
                      {
                        dashboard
                          .lead_pipeline
                          .new
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Contacted
                    </span>

                    <strong>
                      {
                        dashboard
                          .lead_pipeline
                          .contacted
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Proposal
                    </span>

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
                      {
                        dashboard
                          .lead_pipeline
                          .won
                      }
                    </strong>
                  </div>
                </div>
              </div>
            </section>

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

                {dashboard
                  .tasks_due_today.length ===
                0 ? (
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

                {dashboard
                  .recent_activity.length ===
                0 ? (
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