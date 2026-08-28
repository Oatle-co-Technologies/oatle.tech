"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import BackToDashboard from "@/components/dashboard/BackToDashboard";

type Client = {
  id: number;
  name: string;
  company: string;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  base_price: number | string | null;
  pricing_type: string;
  active: boolean;
};

type AddOn = {
  id: number;
  name: string;
  description: string | null;
  price: number | string | null;
  active: boolean;
};

type Project = {
  id: number;
  client_id: number;
  product_id: number | null;
  name: string;
  website: string | null;
  plan: string;
  description: string | null;
  status: string;
  target_date: string | null;
  notes: string | null;
  created_at: string;
};

type ProjectForm = {
  client_id: string;
  product_id: string;
  name: string;
  website: string;
  description: string;
  status: string;
  target_date: string;
  notes: string;
};

const emptyForm: ProjectForm = {
  client_id: "",
  product_id: "",
  name: "",
  website: "",
  description: "",
  status: "planning",
  target_date: "",
  notes: "",
};

const statuses = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export default function Projects() {
  const { userEmail } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<AddOn[]>([]);

  const [projectAddons, setProjectAddons] = useState<
    Record<number, AddOn[]>
  >({});

  const [selectedAddon, setSelectedAddon] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [form, setForm] =
    useState<ProjectForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    if (!userEmail) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load projects (${response.status})`
        );
      }

      const data: Project[] =
        await response.json();

      setProjects(data);

      await Promise.all(
        data.map((project) =>
          loadProjectAddons(project.id)
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/clients/`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load clients (${response.status})`
        );
      }

      const data: Client[] =
        await response.json();

      setClients(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load clients"
      );
    }
  }

  async function loadProducts() {
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/pricing/products`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load products (${response.status})`
        );
      }

      const data: Product[] =
        await response.json();

      setProducts(
        data.filter(
          (product) => product.active
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    }
  }

  async function loadAddons() {
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/pricing/addons`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load add-ons (${response.status})`
        );
      }

      const data: AddOn[] =
        await response.json();

      setAddons(
        data.filter(
          (addon) => addon.active
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load add-ons"
      );
    }
  }

  async function loadProjectAddons(
    projectId: number
  ) {
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/addons`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load project add-ons (${response.status})`
        );
      }

      const data: AddOn[] =
        await response.json();

      setProjectAddons((current) => ({
        ...current,
        [projectId]: data,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project add-ons"
      );
    }
  }

  useEffect(() => {
    loadProjects();
    loadClients();
    loadProducts();
    loadAddons();
  }, [userEmail]);

  function openAddForm() {
    setEditingProject(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError("");
  }

  function openEditForm(
    project: Project
  ) {
    setEditingProject(project);

    setForm({
      client_id: String(
        project.client_id
      ),
      product_id: project.product_id
        ? String(project.product_id)
        : "",
      name: project.name,
      website:
        project.website ?? "",
      description:
        project.description ?? "",
      status: project.status,
      target_date:
        project.target_date ?? "",
      notes:
        project.notes ?? "",
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
    setForm({ ...emptyForm });
  }

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.client_id) {
      setError(
        "Please select a client."
      );
      return;
    }

    if (!form.product_id) {
      setError(
        "Please select a product before saving the project."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const selectedProduct =
        products.find(
          (product) =>
            product.id ===
            Number(form.product_id)
        );

      if (!selectedProduct) {
        throw new Error(
          "Selected product could not be found."
        );
      }

      const payload = {
        client_id:
          Number(form.client_id),
        product_id:
          Number(form.product_id),
        plan: selectedProduct.name,
        name: form.name,
        website:
          form.website || null,
        description:
          form.description || null,
        status: form.status,
        target_date:
          form.target_date || null,
        notes:
          form.notes || null,
      };

      const url = editingProject
        ? `${API_URL}/projects/${editingProject.id}`
        : `${API_URL}/projects`;

      const method =
        editingProject
          ? "PUT"
          : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to ${
              editingProject
                ? "update"
                : "create"
            } project (${response.status})`
        );
      }

      closeForm();

      await loadProjects();
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

  async function handleDelete(
    projectId: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this project?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete project (${response.status})`
        );
      }

      setProjectAddons((current) => {
        const updated = {
          ...current,
        };

        delete updated[projectId];

        return updated;
      });

      await loadProjects();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete project"
      );
    }
  }

  async function handleAddAddon(
    projectId: number
  ) {
    const addonId =
      selectedAddon[projectId];

    if (!addonId) {
      setError(
        "Please select an add-on first."
      );
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/addons/${addonId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to add add-on (${response.status})`
        );
      }

      setSelectedAddon(
        (current) => ({
          ...current,
          [projectId]: "",
        })
      );

      await loadProjectAddons(
        projectId
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add add-on"
      );
    }
  }

  async function handleRemoveAddon(
    projectId: number,
    addonId: number
  ) {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/addons/${addonId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to remove add-on (${response.status})`
        );
      }

      await loadProjectAddons(
        projectId
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove add-on"
      );
    }
  }

  function getClientName(
    clientId: number
  ) {
    const client = clients.find(
      (item) => item.id === clientId
    );

    if (!client) {
      return `Client #${clientId}`;
    }

    return client.company
      ? `${client.name} — ${client.company}`
      : client.name;
  }

  function getProduct(
    productId: number | null
  ) {
    if (!productId) {
      return null;
    }

    return (
      products.find(
        (item) =>
          item.id === productId
      ) ?? null
    );
  }

  function getProductName(
    productId: number | null
  ) {
    if (!productId) {
      return "No product assigned";
    }

    const product =
      getProduct(productId);

    return product
      ? product.name
      : `Product #${productId}`;
  }

  function getProductPrice(
    productId: number | null
  ) {
    const product =
      getProduct(productId);

    return Number(
      product?.base_price ?? 0
    );
  }

  function getProjectTotal(
    projectId: number
  ) {
    const project = projects.find(
      (item) =>
        item.id === projectId
    );

    if (!project) {
      return 0;
    }

    const productPrice =
      getProductPrice(
        project.product_id
      );

    const addonTotal = (
      projectAddons[projectId] ??
      []
    ).reduce(
      (total, addon) =>
        total +
        Number(
          addon.price ?? 0
        ),
      0
    );

    return (
      productPrice +
      addonTotal
    );
  }

  function getAssignedAddonIds(
    projectId: number
  ) {
    return new Set(
      (
        projectAddons[
          projectId
        ] ?? []
      ).map(
        (addon) => addon.id
      )
    );
  }

  function formatStatus(
    status: string
  ) {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getStatusClass(
    status: string
  ) {
    const normalizedStatus =
      status
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `dashboard-status dashboard-status-${normalizedStatus}`;
  }

  return (
    <div className="dashboard-page">
      <BackToDashboard />

      {/* Header controls */}

      <div className="dashboard-page-actions">
        <button
          type="button"
          className="dashboard-link"
          onClick={
            openAddForm
          }
        >
          + Add Project
        </button>
      </div>

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
                {editingProject
                  ? "EDIT PROJECT"
                  : "NEW PROJECT"}
              </p>

              <h3>
                {editingProject
                  ? "Edit Project"
                  : "Add Project"}
              </h3>
            </div>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div className="dashboard-form-grid">
              <select
                name="client_id"
                value={
                  form.client_id
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="">
                  Select Client
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={
                        client.id
                      }
                      value={
                        client.id
                      }
                    >
                      {client.company
                        ? `${client.name} — ${client.company}`
                        : client.name}
                    </option>
                  )
                )}
              </select>

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
                      }{" "}
                      — R
                      {Number(
                        product.base_price ??
                          0
                      ).toFixed(
                        2
                      )}
                    </option>
                  )
                )}
              </select>

              <input
                name="name"
                placeholder="Project Name"
                value={
                  form.name
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                name="website"
                type="url"
                placeholder="Website"
                value={
                  form.website
                }
                onChange={
                  handleChange
                }
              />

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
                      {formatStatus(
                        status
                      )}
                    </option>
                  )
                )}
              </select>

              <input
                name="target_date"
                type="date"
                value={
                  form.target_date
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <textarea
              name="description"
              placeholder="Project Description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              rows={4}
              className="dashboard-form-textarea"
            />

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
              className="dashboard-form-textarea"
            />

            <div className="dashboard-form-actions">
              <button
                type="submit"
                className="dashboard-action-primary"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : editingProject
                  ? "Update Project"
                  : "Create Project"}
              </button>

              <button
                type="button"
                className="dashboard-action-secondary"
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
        <div className="dashboard-panel dashboard-error-panel">
          <p className="dashboard-error">
            {error}
          </p>
        </div>
      )}

      {/* Project list */}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              PROJECT MANAGEMENT
            </p>

            <h3>
              All Projects
            </h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={
              loadProjects
            }
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="dashboard-muted">
            Loading projects...
          </p>
        )}

        {!loading &&
          projects.length ===
            0 && (
            <p className="dashboard-muted">
              No projects yet.
            </p>
          )}

        {!loading &&
          projects.length >
            0 && (
            <div>
              {projects.map(
                (project) => {
                  const assignedAddons =
                    projectAddons[
                      project.id
                    ] ?? [];

                  const assignedAddonIds =
                    getAssignedAddonIds(
                      project.id
                    );

                  const availableForProject =
                    addons.filter(
                      (addon) =>
                        !assignedAddonIds.has(
                          addon.id
                        )
                    );

                  const productPrice =
                    getProductPrice(
                      project.product_id
                    );

                  const projectTotal =
                    getProjectTotal(
                      project.id
                    );

                  return (
                    <div
                      key={
                        project.id
                      }
                      className="dashboard-list-row dashboard-project-row"
                    >
                      <div className="dashboard-list-content">
                        <h2>
                          {
                            project.name
                          }
                        </h2>

                        <p>
                          Client:{" "}
                          {getClientName(
                            project.client_id
                          )}
                        </p>

                        <p>
                          Product:{" "}
                          {getProductName(
                            project.product_id
                          )}
                        </p>

                        <p>
                          Product Price: R
                          {productPrice.toFixed(
                            2
                          )}
                        </p>

                        <div className="dashboard-status-group">
                          <div className="dashboard-status-item">
                            <span className="dashboard-status-label">
                              Status
                            </span>

                            <span
                              className={getStatusClass(
                                project.status
                              )}
                            >
                              {formatStatus(
                                project.status
                              )}
                            </span>
                          </div>
                        </div>

                        {project.website && (
                          <p>
                            {project.website}
                          </p>
                        )}

                        {project.description && (
                          <p>
                            {
                              project.description
                            }
                          </p>
                        )}

                        {project.target_date && (
                          <p>
                            Target date:{" "}
                            {
                              project.target_date
                            }
                          </p>
                        )}

                        {project.notes && (
                          <p>
                            {
                              project.notes
                            }
                          </p>
                        )}
                      </div>

                      <div className="dashboard-list-actions">
                        <button
                          type="button"
                          className="dashboard-action-edit"
                          onClick={() =>
                            openEditForm(
                              project
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="dashboard-action-delete"
                          onClick={() =>
                            handleDelete(
                              project.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>

                      {/* Project Add-ons */}

                      <div className="dashboard-inline-panel">
                        <div className="dashboard-panel-header">
                          <div>
                            <p className="dashboard-panel-label">
                              PROJECT ADD-ONS
                            </p>

                            <h3>
                              Assigned Add-ons
                            </h3>
                          </div>
                        </div>

                        <p className="dashboard-muted">
                          Add-ons assigned
                          here will
                          automatically
                          be included
                          when an
                          invoice is
                          created for
                          this project.
                        </p>

                        {assignedAddons.length >
                        0 ? (
                          <div className="dashboard-nested-list">
                            {assignedAddons.map(
                              (addon) => (
                                <div
                                  key={
                                    addon.id
                                  }
                                  className="dashboard-nested-row"
                                >
                                  <div>
                                    <strong>
                                      {
                                        addon.name
                                      }
                                    </strong>

                                    {addon.description && (
                                      <p className="dashboard-muted">
                                        {
                                          addon.description
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <div className="dashboard-list-actions">
                                    <span className="dashboard-price">
                                      R
                                      {Number(
                                        addon.price ??
                                          0
                                      ).toFixed(
                                        2
                                      )}
                                    </span>

                                    <button
                                      type="button"
                                      className="dashboard-action-delete"
                                      onClick={() =>
                                        handleRemoveAddon(
                                          project.id,
                                          addon.id
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="dashboard-muted">
                            No add-ons
                            assigned
                            to this
                            project
                            yet.
                          </p>
                        )}

                        {availableForProject.length >
                          0 && (
                          <div className="dashboard-add-row">
                            <select
                              value={
                                selectedAddon[
                                  project.id
                                ] ?? ""
                              }
                              onChange={(
                                event
                              ) =>
                                setSelectedAddon(
                                  (
                                    current
                                  ) => ({
                                    ...current,
                                    [project.id]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                            >
                              <option value="">
                                Select an
                                add-on
                              </option>

                              {availableForProject.map(
                                (addon) => (
                                  <option
                                    key={
                                      addon.id
                                    }
                                    value={
                                      addon.id
                                    }
                                  >
                                    {
                                      addon.name
                                    }{" "}
                                    — R
                                    {Number(
                                      addon.price ??
                                        0
                                    ).toFixed(
                                      2
                                    )}
                                  </option>
                                )
                              )}
                            </select>

                            <button
                              type="button"
                              className="dashboard-action-primary"
                              onClick={() =>
                                handleAddAddon(
                                  project.id
                                )
                              }
                              disabled={
                                !selectedAddon[
                                  project.id
                                ]
                              }
                            >
                              Add Add-on
                            </button>
                          </div>
                        )}

                        {availableForProject.length ===
                          0 &&
                          assignedAddons.length >
                            0 && (
                            <p className="dashboard-muted">
                              All available
                              add-ons are
                              already
                              assigned to
                              this project.
                            </p>
                          )}

                        <div className="dashboard-total-row">
                          <span>
                            Project Total
                          </span>

                          <span>
                            R
                            {projectTotal.toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>
    </div>
  );
}