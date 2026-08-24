"use client";

import { useEffect, useState } from "react";

type Project = {
  id: number;
  client_id: number;
  name: string;
  plan: string;
};

type Task = {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
};

type TaskForm = {
  project_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  due_date: string;
  notes: string;
};

const emptyForm: TaskForm = {
  project_id: "",
  name: "",
  description: "",
  category: "",
  status: "todo",
  priority: "medium",
  due_date: "",
  notes: "",
};

const statuses = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
];

const priorities = [
  "low",
  "medium",
  "high",
  "urgent",
];

const categories = [
  "design",
  "frontend",
  "backend",
  "seo",
  "content",
  "other",
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/tasks/"
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load tasks (${response.status})`
        );
      }

      const data: Task[] = await response.json();
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/projects/"
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load projects (${response.status})`
        );
      }

      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    }
  }

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  function openAddForm() {
    setEditingTask(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(task: Task) {
    setEditingTask(task);

    setForm({
      project_id: String(task.project_id),
      name: task.name,
      description: task.description ?? "",
      category: task.category ?? "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? "",
      notes: task.notes ?? "",
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingTask(null);
    setForm(emptyForm);
  }

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        project_id: Number(form.project_id),
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        notes: form.notes || null,
      };

      const url = editingTask
        ? `http://127.0.0.1:8000/tasks/${editingTask.id}`
        : "http://127.0.0.1:8000/tasks/";

      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${
            editingTask ? "update" : "create"
          } task (${response.status})`
        );
      }

      closeForm();
      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete task (${response.status})`
        );
      }

      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete task"
      );
    }
  }

  function getProjectName(projectId: number) {
    const project = projects.find(
      (item) => item.id === projectId
    );

    return project
      ? project.name
      : `Project #${projectId}`;
  }

  return (
    <div>
      {/* Header controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          className="dashboard-link"
          onClick={openAddForm}
        >
          + Add Task
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: "24px" }}
        >
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                {editingTask ? "EDIT TASK" : "NEW TASK"}
              </p>

              <h3>
                {editingTask
                  ? "Edit Task"
                  : "Add Task"}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              <select
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Project
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              <input
                name="name"
                placeholder="Task Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">
                  Select Category
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                required
              >
                {priorities.map((priority) => (
                  <option
                    key={priority}
                    value={priority}
                  >
                    {priority}
                  </option>
                ))}
              </select>

              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>

            <textarea
              name="description"
              placeholder="Task Description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%",
                marginTop: "16px",
              }}
            />

            <textarea
              name="notes"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%",
                marginTop: "16px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingTask
                  ? "Update Task"
                  : "Create Task"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="dashboard-panel">
          <p>{error}</p>
        </div>
      )}

      {/* Task list */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              TASK MANAGEMENT
            </p>

            <h3>All Tasks</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadTasks}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading tasks...</p>}

        {!loading && tasks.length === 0 && (
          <p>No tasks yet.</p>
        )}

        {!loading && tasks.length > 0 && (
          <div>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "24px",
                  alignItems: "start",
                  padding: "20px 0",
                  borderBottom:
                    "1px solid #e5e5e5",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 10px",
                    }}
                  >
                    {task.name}
                  </h2>

                  <p>
                    Project:{" "}
                    {getProjectName(task.project_id)}
                  </p>

                  <p>
                    Category:{" "}
                    {task.category || "Not set"}
                  </p>

                  <p>Status: {task.status}</p>

                  <p>Priority: {task.priority}</p>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  {task.due_date && (
                    <p>
                      Due date: {task.due_date}
                    </p>
                  )}

                  {task.completed_at && (
                    <p>
                      Completed:{" "}
                      {task.completed_at}
                    </p>
                  )}

                  {task.notes && (
                    <p>{task.notes}</p>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    paddingTop: "2px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditForm(task)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(task.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}