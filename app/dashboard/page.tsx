"use client";

import { useEffect, useState } from "react";
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
  process.env.NEXT_PUBLIC_API_URL ||
  "/api/backend";

const DEVELOPER_PRODUCT_SERVICE_MIN_ID = 2;
const DEVELOPER_PRODUCT_SERVICE_MAX_ID = 18;

const COMMUNICATIONS_PRODUCT_SERVICE_MIN_ID = 19;
const COMMUNICATIONS_PRODUCT_SERVICE_MAX_ID = 28;

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>(
    []
  );
  const [productServices, setProductServices] =
    useState<ProductService[]>([]);
  const [
    availableProductServices,
    setAvailableProductServices,
  ] = useState<ProductService[]>([]);
  const [services, setServices] = useState<Service[]>(
    []
  );
  const [staff, setStaff] = useState<StaffMember[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [assigneeFilter, setAssigneeFilter] =
    useState("");

  const [form, setForm] =
    useState<TaskForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/tasks/`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const data = await response.json();

          if (typeof data?.detail === "string") {
            detail = `: ${data.detail}`;
          }
        } catch {
          // Ignore malformed error responses.
        }

        throw new Error(
          `Failed to load tasks (${response.status})${detail}`
        );
      }

      const data: Task[] =
        await response.json();

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
        `${API_URL}/projects/`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load projects (${response.status})`
        );
      }

      const data: Project[] =
        await response.json();

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
    try {
      const [
        productsResponse,
        servicesResponse,
        staffResponse,
        productServicesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/pricing/products`, {
          headers: {
            Accept: "application/json",
          },
        }),
        fetch(`${API_URL}/pricing/services`, {
          headers: {
            Accept: "application/json",
          },
        }),
        fetch(`${API_URL}/staff/`, {
          headers: {
            Accept: "application/json",
          },
        }),
        fetch(`${API_URL}/product-services/`, {
          headers: {
            Accept: "application/json",
          },
        }),
      ]);

      if (
        !productsResponse.ok ||
        !servicesResponse.ok ||
        !staffResponse.ok ||
        !productServicesResponse.ok
      ) {
        throw new Error(
          "Failed to load task options"
        );
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

      setProducts(
        productsData.filter(
          (item) => item.active
        )
      );

      setServices(
        servicesData.filter(
          (item) => item.active
        )
      );

      setStaff(
        staffData.filter(
          (item) => item.active
        )
      );

      setProductServices(
        productServicesData.filter(
          (item) => item.active
        )
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
    assigneeId: string = ""
  ) {
    if (!productId) {
      setAvailableProductServices([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/product-product-services/product/${productId}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const data = await response.json();

          if (typeof data?.detail === "string") {
            detail = `: ${data.detail}`;
          }
        } catch {
          // Ignore malformed responses.
        }

        throw new Error(
          `Failed to load product services (${response.status})${detail}`
        );
      }

      const associations:
        ProductServiceAssociation[] =
        await response.json();

      const associatedIds = new Set(
        associations.map(
          (association) =>
            association.product_service_id
        )
      );

      let filteredServices =
        productServices.filter(
          (productService) =>
            associatedIds.has(
              productService.id
            ) && productService.active
        );

      if (assigneeId) {
        const selectedStaff =
          staff.find(
            (member) =>
              member.id ===
              Number(assigneeId)
          );

        const isCommunicationsSpecialist =
          selectedStaff?.job_title
            ?.trim()
            .toLowerCase() ===
          "communications specialist";

        if (
          isCommunicationsSpecialist
        ) {
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
    void Promise.all([
      loadTasks(),
      loadProjects(),
      loadTaskOptions(),
    ]);
  }, []);

  function openAddForm() {
    setEditingTask(null);
    setForm({
      ...emptyForm,
      due_date: new Date()
        .toISOString()
        .split("T")[0],
    });

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
              project.id ===
              task.project_id
          )?.product_id
        : null;

    setForm({
      project_id:
        task.project_id !== null
          ? String(task.project_id)
          : "",
      product_id:
        selectedProductId !== null &&
        selectedProductId !== undefined
          ? String(selectedProductId)
          : "",
      product_service_id:
        task.product_service_id !== null
          ? String(task.product_service_id)
          : "",
      service_id:
        task.service_id !== null
          ? String(task.service_id)
          : "",
      assigned_to:
        task.assigned_to !== null
          ? String(task.assigned_to)
          : "",
      task_type:
        task.task_type === "service"
          ? "service"
          : "product",
      name: task.name,
      description:
        task.description ?? "",
      category:
        task.category ?? "",
      status: task.status,
      priority: task.priority,
      due_date:
        task.due_date ?? "",
      notes: task.notes ?? "",
    });

    setShowForm(true);

    void loadTaskOptions();

    if (selectedProductId) {
      void loadProductServices(
        String(selectedProductId),
        task.assigned_to !== null
          ? String(task.assigned_to)
          : ""
      );
    } else {
      setAvailableProductServices([]);
    }
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingTask(null);
    setForm(emptyForm);
    setAvailableProductServices([]);
  }

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "task_type") {
        return {
          ...current,
          task_type:
            value as TaskForm["task_type"],
          project_id: "",
          product_id: "",
          product_service_id: "",
          service_id: "",
          name: "",
        };
      }

      if (name === "product_id") {
        return {
          ...current,
          product_id: value,
          project_id: "",
          product_service_id: "",
        };
      }

      if (name === "assigned_to") {
        return {
          ...current,
          assigned_to: value,
          product_service_id: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });

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

  function validateForm() {
    if (!form.task_type) {
      return "Please select a task type.";
    }

    if (form.task_type === "product") {
      if (!form.product_id) {
        return "Please select a product.";
      }

      if (!form.project_id) {
        return "Please select a project.";
      }

      if (!form.product_service_id) {
        return "Please select a product service.";
      }

      const productId = Number(
        form.product_id
      );

      const projectId = Number(
        form.project_id
      );

      const productServiceId = Number(
        form.product_service_id
      );

      if (!Number.isInteger(productId)) {
        return "The selected product is invalid.";
      }

      if (!Number.isInteger(projectId)) {
        return "The selected project is invalid.";
      }

      if (
        !Number.isInteger(productServiceId)
      ) {
        return "The selected product service is invalid.";
      }

      const project = projects.find(
        (item) => item.id === projectId
      );

      if (!project) {
        return "The selected project could not be found.";
      }

      if (
        project.product_id !== null &&
        project.product_id !== productId
      ) {
        return "The selected project does not use the selected product.";
      }

      const selectedProductService =
        availableProductServices.find(
          (item) =>
            item.id === productServiceId
        );

      if (!selectedProductService) {
        return "The selected product service is not available for this product and assignee.";
      }
    }

    if (form.task_type === "service") {
      if (!form.service_id) {
        return "Please select a service.";
      }

      if (!form.name.trim()) {
        return "Please enter a task name.";
      }

      if (!Number.isInteger(
        Number(form.service_id)
      )) {
        return "The selected service is invalid.";
      }
    }

    if (!form.status) {
      return "Please select a task status.";
    }

    if (!form.priority) {
      return "Please select a priority.";
    }

    if (form.due_date) {
      const datePattern =
        /^\d{4}-\d{2}-\d{2}$/;

      if (!datePattern.test(form.due_date)) {
        return "Please enter a valid due date.";
      }
    }

    if (form.assigned_to) {
      const assigneeId = Number(
        form.assigned_to
      );

      if (!Number.isInteger(assigneeId)) {
        return "The selected assignee is invalid.";
      }

      const assignee = staff.find(
        (member) =>
          member.id === assigneeId
      );

      if (!assignee) {
        return "The selected staff member could not be found.";
      }

      if (!assignee.active) {
        return "The selected staff member is inactive.";
      }
    }

    return "";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let productServiceName = "";

      if (
        form.task_type === "product"
      ) {
        productServiceName =
          availableProductServices.find(
            (item) =>
              item.id ===
              Number(
                form.product_service_id
              )
          )?.name ?? "";

        if (!productServiceName) {
          throw new Error(
            "The selected product service could not be found."
          );
        }
      }

      const payload = {
        project_id:
          form.task_type === "product"
            ? Number(form.project_id)
            : null,

        product_service_id:
          form.task_type === "product"
            ? Number(
                form.product_service_id
              )
            : null,

        service_id:
          form.task_type === "service"
            ? Number(form.service_id)
            : null,

        assigned_to:
          form.assigned_to
            ? Number(form.assigned_to)
            : null,

        task_type:
          form.task_type,

        name:
          form.task_type === "product"
            ? productServiceName
            : form.name.trim(),

        description:
          form.description.trim() ||
          null,

        category:
          form.category || null,

        status:
          form.status,

        priority:
          form.priority,

        due_date:
          form.due_date || null,

        notes:
          form.notes.trim() ||
          null,
      };

      console.log(
        "Submitting task:",
        payload
      );

      const url = editingTask
        ? `${API_URL}/tasks/${editingTask.id}`
        : `${API_URL}/tasks/`;

      const method = editingTask
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      if (!response.ok) {
        let detail =
          "The server rejected the task.";

        try {
          const errorData =
            await response.json();

          if (
            Array.isArray(
              errorData?.detail
            )
          ) {
            detail =
              errorData.detail
                .map(
                  (item: {
                    loc?: string[];
                    msg?: string;
                  }) => {
                    const location =
                      item.loc
                        ?.filter(
                          (part) =>
                            part !==
                            "body"
                        )
                        .join(" → ");

                    return location
                      ? `${location}: ${
                          item.msg ??
                          "Invalid value"
                        }`
                      : item.msg ??
                        "Invalid value";
                  }
                )
                .join("; ");
            } else if (
              typeof errorData?.detail ===
              "string"
            ) {
              detail =
                errorData.detail;
            }
        } catch {
          // Keep the fallback message.
        }

        throw new Error(
          `Failed to ${
            editingTask
              ? "update"
              : "create"
          } task (${response.status}): ${detail}`
        );
      }

      const wasEditing =
        Boolean(editingTask);

      const wasAssigned =
        Boolean(form.assigned_to);

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
      console.error(
        "Task save failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the task."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    taskId: number
  ) {
    const confirmed =
      window.confirm(
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
          headers: {
            Accept:
              "application/json",
          },
        }
      );

      if (!response.ok) {
        let detail = "";

        try {
          const data =
            await response.json();

          if (
            typeof data?.detail ===
            "string"
          ) {
            detail = `: ${data.detail}`;
          }
        } catch {
          // Ignore malformed responses.
        }

        throw new Error(
          `Failed to delete task (${response.status})${detail}`
        );
      }

      await loadTasks();

      setSuccess(
        "Task deleted successfully."
      );
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

    const project =
      projects.find(
        (item) =>
          item.id === projectId
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
          item.id ===
          productServiceId
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
        (item) =>
          item.id === serviceId
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
        (item) =>
          item.id === staffId
      )?.name ??
      `Staff #${staffId}`
    );
  }

  const visibleTasks = tasks.filter(
    (task) => {
      if (!assigneeFilter) {
        return true;
      }

      if (
        assigneeFilter ===
        "unassigned"
      ) {
        return (
          task.assigned_to === null
        );
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

      {/* Header controls */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          className="dashboard-action-button"
          onClick={openAddForm}
          disabled={saving}
        >
          + Add Task
        </button>
      </div>

      {/* Success */}
      {success && (
        <div
          className="dashboard-panel dashboard-success"
          style={{
            marginBottom: "24px",
          }}
        >
          <p>{success}</p>
        </div>
      )}

      {/* Add / Edit form */}
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

          <form
            onSubmit={handleSubmit}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {/* Task Type */}
              <label>
                Task Type

                <select
                  name="task_type"
                  value={
                    form.task_type
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="product">
                    Product task
                  </option>

                  <option value="service">
                    Service task
                  </option>
                </select>
              </label>

              {/* Product Task */}
              {form.task_type ===
              "product" ? (
                <>
                  <label>
                    Product

                    <select
                      name="product_id"
                      value={
                        form.product_id
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >
                      <option value="">
                        Select Product
                      </option>

                      {products.map(
                        (product) => (
                          <option
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >
                            {
                              product.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Project

                    <select
                      name="project_id"
                      value={
                        form.project_id
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >
                      <option value="">
                        Select Project
                      </option>

                      {projects
                        .filter(
                          (project) =>
                            !form.product_id ||
                            project.product_id ===
                              Number(
                                form.product_id
                              )
                        )
                        .map(
                          (
                            project
                          ) => (
                            <option
                              key={
                                project.id
                              }
                              value={
                                project.id
                              }
                            >
                              {
                                project.name
                              }
                            </option>
                          )
                        )}
                    </select>
                  </label>

                  <label>
                    Product Service

                    <select
                      name="product_service_id"
                      value={
                        form.product_service_id
                      }
                      onChange={
                        handleChange
                      }
                      required
                      disabled={
                        !form.product_id ||
                        availableProductServices.length ===
                          0
                      }
                    >
                      <option value="">
                        {!form.product_id
                          ? "Select a Product first"
                          : availableProductServices.length ===
                            0
                          ? "No available product services"
                          : "Select Product Service"}
                      </option>

                      {availableProductServices.map(
                        (
                          productService
                        ) => (
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
                  </label>
                </>
              ) : (
                /* Service Task */
                <label>
                  Service

                  <select
                    name="service_id"
                    value={
                      form.service_id
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >
                    <option value="">
                      Select Service
                    </option>

                    {services.map(
                      (service) => (
                        <option
                          key={
                            service.id
                          }
                          value={
                            service.id
                          }
                        >
                          {
                            service.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}

              {/* Assignee */}
              <label>
                Assignee

                <select
                  name="assigned_to"
                  value={
                    form.assigned_to
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Unassigned
                  </option>

                  {staff.map(
                    (member) => (
                      <option
                        key={
                          member.id
                        }
                        value={
                          member.id
                        }
                      >
                        {member.name}
                        {member.job_title
                          ? ` — ${member.job_title}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {form.assigned_to && (
                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "8px",
                      color:
                        "#777",
                    }}
                  >
                    Email notification
                    will be sent
                    automatically.
                  </small>
                )}
              </label>

              {/* Service Task Name */}
              {form.task_type ===
                "service" && (
                <label>
                  Task Name

                  <input
                    name="name"
                    placeholder="Task Name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>
              )}

              {/* Category */}
              <label>
                Category

                <select
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {formatLabel(
                          category
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* Status */}
              <label>
                Status

                <select
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={
                          status
                        }
                        value={
                          status
                        }
                      >
                        {formatLabel(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* Priority */}
              <label>
                Priority

                <select
                  name="priority"
                  value={
                    form.priority
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  {priorities.map(
                    (priority) => (
                      <option
                        key={
                          priority
                        }
                        value={
                          priority
                        }
                      >
                        {formatLabel(
                          priority
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>

              {/* Due Date */}
              <label>
                Due Date

                <input
                  name="due_date"
                  type="date"
                  value={
                    form.due_date
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>
            </div>

            {/* Description */}
            <label
              style={{
                display:
                  "block",
                marginTop:
                  "16px",
              }}
            >
              Description

              <textarea
                name="description"
                placeholder="Task Description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                rows={4}
                style={{
                  width: "100%",
                  marginTop:
                    "8px",
                }}
              />
            </label>

            {/* Notes */}
            <label
              style={{
                display:
                  "block",
                marginTop:
                  "16px",
              }}
            >
              Notes

              <textarea
                name="notes"
                placeholder="Notes"
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
                rows={4}
                style={{
                  width: "100%",
                  marginTop:
                    "8px",
                }}
              />
            </label>

            <div
              style={{
                display:
                  "flex",
                gap: "12px",
                marginTop:
                  "20px",
              }}
            >
              <button
                type="submit"
                className="dashboard-action-button"
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
                className="dashboard-secondary-button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="dashboard-panel dashboard-error"
          style={{
            marginBottom: "24px",
          }}
          role="alert"
        >
          <strong>
            Something went wrong
          </strong>

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

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <select
              aria-label="Filter tasks by assignee"
              value={
                assigneeFilter
              }
              onChange={(
                event
              ) =>
                setAssigneeFilter(
                  event.target
                    .value
                )
              }
            >
              <option value="">
                All Staff
              </option>

              <option value="unassigned">
                Unassigned
              </option>

              {staff.map(
                (member) => (
                  <option
                    key={
                      member.id
                    }
                    value={
                      member.id
                    }
                  >
                    {member.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-empty">
            <p>Loading tasks...</p>
          </div>
        ) : visibleTasks.length ===
          0 ? (
          <div className="dashboard-empty">
            <span>01</span>

            <p>
              No tasks found.
            </p>
          </div>
        ) : (
          <div className="dashboard-task-list">
            {visibleTasks.map(
              (task) => (
                <div
                  key={
                    task.id
                  }
                  className={`dashboard-task-card ${
                    task.assigned_to
                      ? "dashboard-task-card-staff"
                      : "dashboard-task-card-owner"
                  }`}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "20px",
                      alignItems:
                        "flex-start",
                    }}
                  >
                    <div>
                      <strong>
                        {task.name}
                      </strong>

                      <p>
                        {task.task_type ===
                        "service"
                          ? getServiceName(
                              task.service_id
                            )
                          : getProductServiceName(
                              task.product_service_id
                            )}
                      </p>
                    </div>

                    <span
                      className={`dashboard-priority dashboard-priority-${task.priority}`}
                    >
                      {formatLabel(
                        task.priority
                      )}
                    </span>
                  </div>

                  <div className="dashboard-task-meta">
                    <span>
                      <strong>
                        Assigned to
                      </strong>{" "}
                      {getStaffName(
                        task.assigned_to
                      )}
                    </span>

                    <span>
                      <strong>
                        Status
                      </strong>{" "}
                      {formatLabel(
                        task.status
                      )}
                    </span>

                    <span>
                      <strong>
                        Project
                      </strong>{" "}
                      {getProjectName(
                        task.project_id
                      )}
                    </span>

                    {task.due_date && (
                      <span>
                        <strong>
                          Due
                        </strong>{" "}
                        {
                          task.due_date
                        }
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "8px",
                      marginTop:
                        "16px",
                    }}
                  >
                    <button
                      type="button"
                      className="dashboard-small-button"
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
                      className="dashboard-small-button dashboard-danger-button"
                      onClick={() =>
                        void handleDelete(
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