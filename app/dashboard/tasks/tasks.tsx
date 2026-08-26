"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import BackToDashboard from "@/components/dashboard/BackToDashboard";

type Project = {
  id: number;
  client_id: number;
  product_id: number | null;
  name: string;
  plan: string;
};

type Product = {
  id: number;
  name: string;
  active: boolean;
};

type ProductService = {
  id: number;
  name: string;
  active: boolean;
};

type ProductServiceAssociation = {
  product_id: number;
  product_service_id: number;
};

type Service = {
  id: number;
  name: string;
  active: boolean;
};

type StaffMember = {
  id: number;
  name: string;
  job_title: string | null;
  active: boolean;
};

type Task = {
  id: number;
  project_id: number | null;
  product_service_id: number | null;
  service_id: number | null;
  assigned_to: number | null;
  task_type: string;
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
  product_id: string;
  product_service_id: string;
  service_id: string;
  assigned_to: string;
  task_type: "product" | "service";
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
  product_id: "",
  product_service_id: "",
  service_id: "",
  assigned_to: "",
  task_type: "product",
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

const DEVELOPER_PRODUCT_SERVICE_MIN_ID = 2;
const DEVELOPER_PRODUCT_SERVICE_MAX_ID = 18;

const COMMUNICATIONS_PRODUCT_SERVICE_MIN_ID = 19;
const COMMUNICATIONS_PRODUCT_SERVICE_MAX_ID = 28;

export default function Tasks() {
  const { userEmail } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productServices, setProductServices] = useState<
    ProductService[]
  >([]);
  const [availableProductServices, setAvailableProductServices] =
    useState<ProductService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("");

  const [form, setForm] = useState<TaskForm>({
    ...emptyForm,
  });
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    if (!userEmail) { return; }
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/tasks`);

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
    if (!userEmail) { return; }
    try {
      const response = await fetch(`${API_URL}/projects`);

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

  async function loadTaskOptions() {
    if (!userEmail) { return; }
    try {
      const [
        productsResponse,
        servicesResponse,
        staffResponse,
        productServicesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/pricing/products`),
        fetch(`${API_URL}/pricing/services`),
        fetch(`${API_URL}/staff`),
        fetch(`${API_URL}/product-services`),
      ]);

      if (
        !productsResponse.ok ||
        !servicesResponse.ok ||
        !staffResponse.ok ||
        !productServicesResponse.ok
      ) {
        throw new Error("Failed to load task options");
      }

      const [
        productsData,
        servicesData,
        staffData,
        productServicesData,
      ]: [
        Product[],
        Service[],
        StaffMember[],
        ProductService[],
      ] = await Promise.all([
        productsResponse.json(),
        servicesResponse.json(),
        staffResponse.json(),
        productServicesResponse.json(),
      ]);

      setProducts(productsData);
      setServices(servicesData);
      setStaff(staffData.filter((item) => item.active));
      setProductServices(
        productServicesData.filter((item) => item.active)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load task options"
      );
    }
  }

  async function loadProductServices(
    productId: string,
    assigneeId: string = form.assigned_to
  ) {
    if (!userEmail) { return; }
    if (!productId) {
      setAvailableProductServices([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/product-product-services/product/${productId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load product services (${response.status})`
        );
      }

      const associations: ProductServiceAssociation[] =
        await response.json();

      const associatedProductServiceIds = new Set(
        associations.map(
          (association) =>
            association.product_service_id
        )
      );

      let filteredServices = productServices.filter(
        (productService) =>
          associatedProductServiceIds.has(
            productService.id
          ) && productService.active
      );

      if (assigneeId) {
        const selectedStaff = staff.find(
          (member) =>
            member.id === Number(assigneeId)
        );

        const isCommunicationsSpecialist =
          selectedStaff?.job_title
            ?.trim()
            .toLowerCase() ===
          "communications specialist";

        if (isCommunicationsSpecialist) {
          filteredServices =
            filteredServices.filter(
              (service) =>
                service.id >=
                  COMMUNICATIONS_PRODUCT_SERVICE_MIN_ID &&
                service.id <=
                  COMMUNICATIONS_PRODUCT_SERVICE_MAX_ID
            );
        } else {
          filteredServices =
            filteredServices.filter(
              (service) =>
                service.id >=
                  DEVELOPER_PRODUCT_SERVICE_MIN_ID &&
                service.id <=
                  DEVELOPER_PRODUCT_SERVICE_MAX_ID
            );
        }
      }

      setAvailableProductServices(
        filteredServices
      );
    } catch (err) {
      setAvailableProductServices([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load product services"
      );
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadTasks();
      void loadProjects();
      void loadTaskOptions();
    });
  }, [userEmail]);

  function openAddForm() {
    setEditingTask(null);
    setForm({ ...emptyForm });
    setAvailableProductServices([]);
    setShowForm(true);
    setError("");
    setSuccess("");
    void loadTaskOptions();
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setError("");
    setSuccess("");

    const selectedProductId =
      task.task_type === "product"
        ? projects.find(
            (project) =>
              project.id === task.project_id
          )?.product_id
        : null;

    setForm({
      project_id: task.project_id
        ? String(task.project_id)
        : "",
      product_id: selectedProductId
        ? String(selectedProductId)
        : "",
      product_service_id: task.product_service_id
        ? String(task.product_service_id)
        : "",
      service_id: task.service_id
        ? String(task.service_id)
        : "",
      assigned_to: task.assigned_to
        ? String(task.assigned_to)
        : "",
      task_type:
        task.task_type === "service"
          ? "service"
          : "product",
      name: task.name,
      description: task.description ?? "",
      category: task.category ?? "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? "",
      notes: task.notes ?? "",
    });

    setShowForm(true);
    void loadTaskOptions();

    if (selectedProductId) {
      void loadProductServices(
        String(selectedProductId),
        task.assigned_to
          ? String(task.assigned_to)
          : ""
      );
    } else {
      setAvailableProductServices([]);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingTask(null);
    setForm({ ...emptyForm });
    setAvailableProductServices([]);
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
      ...(name === "task_type"
        ? {
            project_id: "",
            product_id: "",
            product_service_id: "",
            service_id: "",
          }
        : name === "product_id"
        ? {
            project_id: "",
            product_service_id: "",
          }
        : name === "assigned_to"
        ? {
            product_service_id: "",
          }
        : {}),
    }));

    if (name === "product_id") {
      void loadProductServices(
        value,
        form.assigned_to
      );
    }

    if (name === "assigned_to") {
      if (form.product_id) {
        void loadProductServices(
          form.product_id,
          value
        );
      } else {
        setAvailableProductServices([]);
      }
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const productServiceName =
        availableProductServices.find(
          (item) =>
            item.id ===
            Number(form.product_service_id)
        )?.name;

      const payload = {
        project_id:
          form.task_type === "product"
            ? Number(form.project_id)
            : null,

        product_service_id:
          form.task_type === "product"
            ? Number(form.product_service_id)
            : null,

        service_id:
          form.task_type === "service"
            ? Number(form.service_id)
            : null,

        assigned_to: form.assigned_to
          ? Number(form.assigned_to)
          : null,

        task_type: form.task_type,

        name:
          form.task_type === "product"
            ? productServiceName ?? ""
            : form.name,

        description:
          form.description || null,

        category:
          form.category || null,

        status: form.status,

        priority: form.priority,

        due_date:
          form.due_date || null,

        notes:
          form.notes || null,
      };

      const url = editingTask
        ? `${API_URL}/tasks/${editingTask.id}`
        : `${API_URL}/tasks`;

      const method = editingTask
        ? "PUT"
        : "POST";

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
            editingTask
              ? "update"
              : "create"
          } task (${response.status})`
        );
      }

      const wasEditing = Boolean(editingTask);
      const wasAssigned = Boolean(form.assigned_to);

      closeForm();
      await loadTasks();

      setSuccess(
        wasEditing
          ? "Task updated successfully."
          : wasAssigned
          ? "Task created successfully. The assignee has been notified by email."
          : "Task created successfully."
      );
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
      setSuccess("");

      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
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

      setSuccess("Task deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete task"
      );
    }
  }

  function getProjectName(
    projectId: number | null
  ) {
    if (projectId === null) {
      return "Not linked";
    }

    const project = projects.find(
      (item) => item.id === projectId
    );

    return project
      ? project.name
      : `Project #${projectId}`;
  }

  function getProductServiceName(
    productServiceId: number | null
  ) {
    if (productServiceId === null) {
      return "Not set";
    }

    return (
      productServices.find(
        (item) =>
          item.id === productServiceId
      )?.name ??
      `Product service #${productServiceId}`
    );
  }

  function getServiceName(
    serviceId: number | null
  ) {
    if (serviceId === null) {
      return "Not set";
    }

    return (
      services.find(
        (item) => item.id === serviceId
      )?.name ??
      `Service #${serviceId}`
    );
  }

  function getStaffName(
    staffId: number | null
  ) {
    if (staffId === null) {
      return "Unassigned";
    }

    return (
      staff.find(
        (item) => item.id === staffId
      )?.name ??
      `Staff #${staffId}`
    );
  }

  function refreshTasks() {
    void loadTasks();
    void loadTaskOptions();

    if (form.product_id) {
      void loadProductServices(
        form.product_id,
        form.assigned_to
      );
    }
  }

  const visibleTasks = tasks.filter(
    (task) => {
      if (!assigneeFilter) {
        return true;
      }

      if (
        assigneeFilter === "unassigned"
      ) {
        return task.assigned_to === null;
      }

      return (
        task.assigned_to ===
        Number(assigneeFilter)
      );
    }
  );

  return (
    <div>
      <BackToDashboard />

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

      {success && (
        <div
          className="dashboard-panel"
          style={{
            marginBottom: "24px",
          }}
        >
          <p>{success}</p>
        </div>
      )}

      {showForm && (
        <div
          className="dashboard-panel"
          style={{
            marginBottom: "24px",
          }}
        >
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                {editingTask
                  ? "EDIT TASK"
                  : "NEW TASK"}
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
                name="task_type"
                value={form.task_type}
                onChange={handleChange}
                required
              >
                <option value="product">
                  Product task
                </option>

                <option value="service">
                  Service task
                </option>
              </select>

              {form.task_type ===
              "product" ? (
                <>
                  <select
                    name="product_id"
                    value={form.product_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Product
                    </option>

                    {products.map(
                      (product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    name="project_id"
                    value={form.project_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Project
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    name="product_service_id"
                    value={
                      form.product_service_id
                    }
                    onChange={handleChange}
                    required
                    disabled={
                      !form.product_id
                    }
                  >
                    <option value="">
                      {form.product_id
                        ? "Select Product Service"
                        : "Select a Product first"}
                    </option>

                    {availableProductServices.map(
                      (productService) => (
                        <option
                          key={
                            productService.id
                          }
                          value={
                            productService.id
                          }
                        >
                          {
                            productService.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </>
              ) : (
                <select
                  name="service_id"
                  value={form.service_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Service
                  </option>

                  {services.map(
                    (service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    )
                  )}
                </select>
              )}

              <label>
                Assignee

                <select
                  name="assigned_to"
                  value={form.assigned_to}
                  onChange={handleChange}
                  style={{
                    display: "block",
                    width: "100%",
                  }}
                >
                  <option value="">
                    Unassigned
                  </option>

                  {staff.map(
                    (member) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.name}
                      </option>
                    )
                  )}
                </select>

                {form.assigned_to && (
                  <small
                    style={{
                      display: "block",
                      marginTop: "8px",
                      opacity: 0.7,
                    }}
                  >
                    📧 Email notification will
                    be sent automatically.
                  </small>
                )}
              </label>

              {form.task_type ===
                "service" && (
                <input
                  name="name"
                  placeholder="Task Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              )}

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">
                  Select Category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                required
              >
                {priorities.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  )
                )}
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

      {error && (
        <div className="dashboard-panel">
          <p>{error}</p>
        </div>
      )}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              TASK MANAGEMENT
            </p>

            <h3>All Tasks</h3>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <select
              aria-label="Filter tasks by assignee"
              value={assigneeFilter}
              onChange={(event) =>
                setAssigneeFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Staff
              </option>

              {staff.map(
                (member) => (
                  <option
                    key={member.id}
                    value={member.id}
                  >
                    {member.name}
                  </option>
                )
              )}

              <option value="unassigned">
                Unassigned
              </option>
            </select>

            <button
              type="button"
              className="dashboard-link"
              onClick={refreshTasks}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <p>Loading tasks...</p>
        )}

        {!loading &&
          visibleTasks.length ===
            0 && (
            <p>No tasks yet.</p>
          )}

        {!loading &&
          visibleTasks.length >
            0 && (
            <div>
              {visibleTasks.map(
                (task) => (
                  <div
                    key={task.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr auto",
                      gap: "24px",
                      alignItems:
                        "start",
                      padding:
                        "20px 0",
                      borderBottom:
                        "1px solid #e5e5e5",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin:
                            "0 0 10px",
                        }}
                      >
                        {task.name}
                      </h2>

                      <p>
                        Project:{" "}
                        {getProjectName(
                          task.project_id
                        )}
                      </p>

                      <p>
                        Type:{" "}
                        {task.task_type ===
                        "product"
                          ? "Product"
                          : "Service"}
                      </p>

                      <p>
                        {task.task_type ===
                        "product"
                          ? `Product service: ${getProductServiceName(
                              task.product_service_id
                            )}`
                          : `Service: ${getServiceName(
                              task.service_id
                            )}`}
                      </p>

                      <p>
                        Assigned to:{" "}
                        {getStaffName(
                          task.assigned_to
                        )}
                      </p>

                      <p>
                        Category:{" "}
                        {task.category ||
                          "Not set"}
                      </p>

                      <p>
                        Status:{" "}
                        {task.status}
                      </p>

                      <p>
                        Priority:{" "}
                        {task.priority}
                      </p>

                      {task.description && (
                        <p>
                          {
                            task.description
                          }
                        </p>
                      )}

                      {task.due_date && (
                        <p>
                          Due date:{" "}
                          {task.due_date}
                        </p>
                      )}

                      {task.completed_at && (
                        <p>
                          Completed:{" "}
                          {
                            task.completed_at
                          }
                        </p>
                      )}

                      {task.notes && (
                        <p>
                          {task.notes}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: "10px",
                        paddingTop:
                          "2px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            task
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            task.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}