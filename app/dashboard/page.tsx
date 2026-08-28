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

type StaffMember = {
  id: number;
  name: string;
  email: string;
  access_level: string;
  active: boolean;
};

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
  due_date: string | null;
  assigned_to: number | null;
};

type RecentActivity = {
  id: number;
  type: string;
  name: string;
  status: string;
  created_at: string | null;
  assigned_to?: number | null;
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
    href: "/dashboard/projects",
    label: "Projects",
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
  },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getPriorityClass(priority: string) {
  const normalized = priority
    .toLowerCase()
    .trim();

  if (normalized === "urgent") {
    return "dashboard-priority dashboard-priority-urgent";
  }

  if (normalized === "high") {
    return "dashboard-priority dashboard-priority-high";
  }

  if (normalized === "medium") {
    return "dashboard-priority dashboard-priority-medium";
  }

  return "dashboard-priority dashboard-priority-low";
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
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [userEmail, setUserEmail] = useState("");
  const [currentStaffId, setCurrentStaffId] =
    useState<number | null>(null);

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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobileNavOpen, setMobileNavOpen] =
    useState(false);

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
    async function loadUser() {
      try {
        const result =
          await authClient.getSession();

        const email =
          result.data?.user?.email
            ?.toLowerCase()
            .trim() ?? "";

        setUserEmail(email);

        if (!email) {
          return;
        }

        const savedName =
          window.localStorage.getItem(
            `oatle-display-name:${email}`
          );

        if (savedName) {
          setDisplayName(savedName);
          setShowNameSetup(false);
        } else {
          setShowNameSetup(true);
        }

        /*
         * Find the logged-in user's Staff record.
         *
         * This is only used to visually distinguish
         * the user's tasks from other staff tasks.
         */
        try {
          const staffResponse =
            await fetch(
              `${API_URL}/staff`,
              {
                cache: "no-store",
              }
            );

          if (staffResponse.ok) {
            const staff:
              | StaffMember[]
              = await staffResponse.json();

            const currentStaff =
              staff.find(
                (member) =>
                  member.email
                    ?.toLowerCase()
                    .trim() === email
              );

            if (currentStaff) {
              setCurrentStaffId(
                currentStaff.id
              );
            }
          }
        } catch (staffError) {
          console.error(
            "Failed to load staff information:",
            staffError
          );
        }
      } catch (err) {
        console.error(
          "Failed to load authenticated user:",
          err
        );
      }
    }

    void loadUser();
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
    void loadDashboard();
  }, []);

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

        {/* Display Name Setup */}
        {showNameSetup && (
          <section className="dashboard-panel dashboard-name-setup">
            <p className="dashboard-panel-label">
              WELCOME TO OATLE
            </p>

            <h2>
              What would you like us to call you?
            </h2>

            <p>
              Choose the name you'd like to use
              inside your Oatle dashboard.
            </p>

            <form
              onSubmit={handleSaveDisplayName}
              className="dashboard-name-form"
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
              />

              <button
                type="submit"
                className="dashboard-action-button"
                disabled={savingName}
              >
                {savingName
                  ? "Saving..."
                  : "Continue"}
              </button>
            </form>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="dashboard-panel dashboard-error">
            <strong>
              Something went wrong
            </strong>

            <p>{error}</p>

            <button
              type="button"
              className="dashboard-action-button"
              onClick={() =>
                void loadDashboard()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="dashboard-panel">
            <p>Loading dashboard...</p>
          </div>
        )}

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
                  {
                    dashboard.projects_in_progress
                  }
                </h2>

                <span>In progress</span>
              </div>
            </section>

            {/* Projects + Lead Pipeline */}
            <section className="dashboard-grid">
              {/* Projects */}
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
                    className="dashboard-action-button"
                  >
                    View All
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
                  <div className="dashboard-list">
                    {dashboard.projects.map(
                      (project) => (
                        <div
                          key={project.id}
                          className="dashboard-list-row dashboard-project-row"
                        >
                          <div>
                            <strong>
                              {project.name}
                            </strong>

                            <p>
                              {formatLabel(
                                project.status
                              )}
                            </p>
                          </div>

                          {project.target_date && (
                            <span className="dashboard-list-meta">
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

              {/* Lead Pipeline */}
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
                    className="dashboard-action-button"
                  >
                    View All
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

            {/* Tasks + Recent Activity */}
            <section className="dashboard-grid">
              {/* Tasks */}
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
                    className="dashboard-action-button"
                  >
                    View All
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
                  <div className="dashboard-task-list">
                    {dashboard.tasks_due_today.map(
                      (task) => {
                        const isOwner =
                          currentStaffId !==
                            null &&
                          task.assigned_to ===
                            currentStaffId;

                        return (
                          <div
                            key={task.id}
                            className={`dashboard-task-card ${
                              isOwner
                                ? "dashboard-task-card-owner"
                                : "dashboard-task-card-staff"
                            }`}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "space-between",
                                gap: "16px",
                              }}
                            >
                              <strong>
                                {task.name}
                              </strong>

                              <span
                                className={getPriorityClass(
                                  task.priority
                                )}
                              >
                                {formatLabel(
                                  task.priority
                                )}
                              </span>
                            </div>

                            <p>
                              {formatLabel(
                                task.status
                              )}
                            </p>

                            <div className="dashboard-task-meta">
                              <span>
                                <strong>
                                  Assigned:
                                </strong>{" "}
                                {isOwner
                                  ? "You"
                                  : task.assigned_to
                                    ? "Staff"
                                    : "Unassigned"}
                              </span>

                              {task.due_date && (
                                <span>
                                  <strong>
                                    Due:
                                  </strong>{" "}
                                  {
                                    task.due_date
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
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
                  .recent_activity.length ===
                0 ? (
                  <div className="dashboard-empty">
                    <span>03</span>

                    <p>
                      No recent activity.
                    </p>
                  </div>
                ) : (
                  <div className="dashboard-list">
                    {dashboard.recent_activity.map(
                      (activity) => {
                        /*
                         * The dashboard backend currently
                         * returns task activity. When an
                         * assigned_to value is available,
                         * use it to match the same pink/gold
                         * staff distinction used by Tasks.
                         *
                         * If older backend data doesn't include
                         * assigned_to, the activity remains
                         * neutral rather than falsely claiming
                         * ownership.
                         */
                        const isOwner =
                          currentStaffId !==
                            null &&
                          activity.assigned_to ===
                            currentStaffId;

                        const activityClass =
                          activity.assigned_to ==
                            null ||
                          activity.assigned_to ===
                            undefined
                            ? "dashboard-activity"
                            : isOwner
                              ? "dashboard-activity dashboard-activity-task"
                              : "dashboard-activity dashboard-activity-other";

                        return (
                          <div
                            key={`${activity.type}-${activity.id}`}
                            className={`dashboard-list-row ${activityClass}`}
                          >
                            {activity.assigned_to !=
                              null && (
                              <span
                                className="dashboard-activity-indicator"
                                aria-hidden="true"
                              />
                            )}

                            <div>
                              <strong>
                                {activity.name}
                              </strong>

                              <p>
                                {formatLabel(
                                  activity.type
                                )}{" "}
                                ·{" "}
                                {formatLabel(
                                  activity.status
                                )}
                              </p>

                              {activity.created_at && (
                                <p>
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
    </div>
  );
}