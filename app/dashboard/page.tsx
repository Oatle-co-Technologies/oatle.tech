"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

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
  assigned_to: number | null;
  created_at: string | null;
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
    href: "/dashboard/appointments",
    label: "Appointments",
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
  },

];

const adminNavigationItems = [
  {
    href: "/dashboard/staff",
    label: "Staff",
  },
  {
    href: "/dashboard/invoices",
    label: "Invoices",
  },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatActivityDate(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();

  const {
    staff,
    loading: authLoading,
  } = useAuth();

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [displayName, setDisplayName] =
    useState("");

  const [displayNameInput, setDisplayNameInput] =
    useState("");

  const [showNameSetup, setShowNameSetup] =
    useState(false);

  const [savingName, setSavingName] =
    useState(false);

  const [greetingMessage, setGreetingMessage] =
    useState(greetingMessages[0]);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

  const isAdmin =
    staff?.access_level === "admin";

  const userEmail =
    staff?.email || "";

  /*
   * The current logged-in staff record gives us
   * the database staff ID.
   *
   * Recent Activity uses assigned_to to determine
   * which staff member owns each task.
   */
  const currentStaffId =
    staff?.id ?? null;

  useEffect(() => {
    const randomIndex = Math.floor(
      Math.random() *
        greetingMessages.length
    );

    setGreetingMessage(
      greetingMessages[randomIndex]
    );
  }, []);

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
      setShowNameSetup(false);
    } else {
      setShowNameSetup(true);
    }
  }, [userEmail]);

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
    if (authLoading) {
      return;
    }

    void loadDashboard();
  }, [authLoading]);

  function handleSaveDisplayName(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name =
      displayNameInput.trim();

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

  /*
   * Determine which colour belongs to a task.
   *
   * Pink = current user's work.
   * Gold = another staff member's work.
   * Neutral = unassigned.
   *
   * We deliberately use the actual staff ID rather
   * than guessing from a person's name or role.
   */
  function getTaskOwnerClass(
    assignedTo: number | null
  ) {
    if (assignedTo === null) {
      return "dashboard-task-owner-unassigned";
    }

    if (
      currentStaffId !== null &&
      assignedTo === currentStaffId
    ) {
      return "dashboard-task-owner-me";
    }

    return "dashboard-task-owner-staff";
  }

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
          {mobileNavOpen
            ? "Close"
            : "Menu"}
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
          {navigationItems.map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`dashboard-nav-item ${
                  item.href ===
                  "/dashboard"
                    ? "active"
                    : ""
                }`}
                onClick={closeMobileNav}
              >
                {item.label}
              </Link>
            )
          )}

          {adminNavigationItems.map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className="dashboard-nav-item"
                onClick={closeMobileNav}
              >
                {item.label}
              </Link>
            )
          )}
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

        {/* Display Name Setup */}
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
              What would you like us
              to call you?
            </h2>

            <p
              style={{
                marginBottom: "20px",
                color: "#777",
              }}
            >
              This name is only used for
              your dashboard greeting.
            </p>

            <form
              onSubmit={
                handleSaveDisplayName
              }
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                value={
                  displayNameInput
                }
                onChange={(event) =>
                  setDisplayNameInput(
                    event.target.value
                  )
                }
                placeholder="Your name"
                required
              />

              <button
                type="submit"
                disabled={savingName}
              >
                {savingName
                  ? "Saving..."
                  : "Save Name"}
              </button>
            </form>
          </section>
        )}

        {/* Error */}
        {error && (
          <div
            className="dashboard-panel"
            style={{
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                color: "#c62828",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {dashboardLoading && (
          <div
            className="dashboard-panel"
            style={{
              marginBottom: "24px",
            }}
          >
            <p>
              Loading dashboard...
            </p>
          </div>
        )}

        {/* Dashboard */}
        {!dashboardLoading &&
          dashboard && (
            <>
              {/* Stats */}
              <section className="dashboard-stats">
                <div className="dashboard-card">
                  <p>Revenue</p>

                  <h2>
                    R
                    {Number(
                      dashboard.revenue
                    ).toLocaleString(
                      "en-ZA"
                    )}
                  </h2>

                  <span>
                    This month
                  </span>
                </div>

                <div className="dashboard-card">
                  <p>
                    Active Clients
                  </p>

                  <h2>
                    {
                      dashboard.active_clients
                    }
                  </h2>

                  <span>
                    Currently active
                  </span>
                </div>

                <div className="dashboard-card">
                  <p>
                    Open Leads
                  </p>

                  <h2>
                    {
                      dashboard.open_leads
                    }
                  </h2>

                  <span>
                    Needs attention
                  </span>
                </div>

                <div className="dashboard-card">
                  <p>Projects</p>

                  <h2>
                    {
                      dashboard.projects_in_progress
                    }
                  </h2>

                  <span>
                    In progress
                  </span>
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

                      <h3>
                        Projects
                      </h3>
                    </div>

                    <Link
                      href="/dashboard/projects"
                      className="dashboard-link"
                    >
                      View all
                    </Link>
                  </div>

                  {dashboard.projects
                    .length === 0 ? (
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
                            key={
                              project.id
                            }
                            style={{
                              display:
                                "flex",
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
                                {
                                  project.name
                                }
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
                                {formatLabel(
                                  project.status
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
                                {
                                  project.target_date
                                }
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
                      <span>
                        New
                      </span>

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
                      <span>
                        Won
                      </span>

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

              {/* Tasks + Recent Activity */}
              <section className="dashboard-grid">
                {/* Today's Tasks */}
                <div className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <p className="dashboard-panel-label">
                        TODAY
                      </p>

                      <h3>
                        Tasks
                      </h3>
                    </div>

                    <Link
                      href="/dashboard/tasks"
                      className="dashboard-link"
                    >
                      View all
                    </Link>
                  </div>

                  {dashboard
                    .tasks_due_today
                    .length === 0 ? (
                    <div className="dashboard-empty">
                      <span>02</span>

                      <p>
                        No tasks due
                        today.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {dashboard.tasks_due_today.map(
                        (task) => (
                          <div
                            key={
                              task.id
                            }
                            className={`dashboard-task-row ${getTaskOwnerClass(
                              task.assigned_to
                            )}`}
                            style={{
                              display:
                                "flex",
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
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "stretch",
                                gap: "16px",
                              }}
                            >
                              <span
                                className="dashboard-task-owner-indicator"
                                aria-hidden="true"
                              />

                              <div>
                                <strong>
                                  {
                                    task.name
                                  }
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
                                  {formatLabel(
                                    task.status
                                  )}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`dashboard-task-priority dashboard-task-priority-${task.priority.toLowerCase()}`}
                            >
                              {formatLabel(
                                task.priority
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
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
                    .recent_activity
                    .length === 0 ? (
                    <div className="dashboard-empty">
                      <span>03</span>

                      <p>
                        No recent
                        activity.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {dashboard.recent_activity.map(
                        (activity) => {
                          const ownerClass =
                            getTaskOwnerClass(
                              activity.assigned_to
                            );

                          return (
                            <div
                              key={`${activity.type}-${activity.id}`}
                              className={`dashboard-activity-row ${ownerClass}`}
                              style={{
                                display:
                                  "flex",
                                gap: "16px",
                                padding:
                                  "14px 0",
                                borderBottom:
                                  "1px solid #e5e5e5",
                              }}
                            >
                              <span
                                className="dashboard-activity-owner-indicator"
                                aria-hidden="true"
                              />

                              <div>
                                <strong
                                  style={{
                                    display:
                                      "block",
                                    marginBottom:
                                      "6px",
                                  }}
                                >
                                  {
                                    activity.name
                                  }
                                </strong>

                                <p
                                  style={{
                                    margin:
                                      "0 0 6px",
                                    fontSize:
                                      "13px",
                                    color:
                                      "#777",
                                  }}
                                >
                                  {formatLabel(
                                    activity.type
                                  )}{" "}
                                  ·{" "}
                                  {formatLabel(
                                    activity.status
                                  )}
                                </p>

                                {activity.created_at && (
                                  <p
                                    style={{
                                      margin:
                                        "0",
                                      fontSize:
                                        "13px",
                                      color:
                                        "#777",
                                    }}
                                  >
                                    {formatActivityDate(
                                      activity.created_at
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
      </main>

      <style jsx>{`
        .dashboard-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border: 1px solid #d9d9d9;
          border-radius: 999px;
          background: #ffffff;
          color: #222222;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition:
            background-color 0.15s ease,
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .dashboard-link:hover {
          background: #f7f5f1;
          border-color: #cfcfcf;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.09);
        }

        .dashboard-task-owner-indicator,
        .dashboard-activity-owner-indicator {
          flex: 0 0 6px;
          width: 6px;
          min-height: 32px;
          border-radius: 999px;
          background: #d9d9d9;
        }

        .dashboard-task-owner-me
          .dashboard-task-owner-indicator,
        .dashboard-task-owner-me
          .dashboard-activity-owner-indicator {
          background: #d98aaa;
        }

        .dashboard-task-owner-staff
          .dashboard-task-owner-indicator,
        .dashboard-task-owner-staff
          .dashboard-activity-owner-indicator {
          background: #d9a21b;
        }

        .dashboard-task-owner-unassigned
          .dashboard-task-owner-indicator,
        .dashboard-task-owner-unassigned
          .dashboard-activity-owner-indicator {
          background: #d9d9d9;
        }

        .dashboard-task-priority {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 62px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .dashboard-task-priority-high {
          background: #f8dfe8;
          color: #8f3154;
        }

        .dashboard-task-priority-medium {
          background: #fff1cc;
          color: #8a6400;
        }

        .dashboard-task-priority-low {
          background: #eeeeee;
          color: #555555;
        }

        .dashboard-task-row,
        .dashboard-activity-row {
          position: relative;
        }

        @media (max-width: 700px) {
          .dashboard-link {
            padding: 7px 11px;
            font-size: 12px;
          }

          .dashboard-task-row {
            align-items: flex-start;
          }

          .dashboard-task-priority {
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
}