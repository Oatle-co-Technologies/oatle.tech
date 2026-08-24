"use client";

import { useEffect, useState } from "react";
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

const API_URL = "http://127.0.0.1:8000";

export default function Projects() {
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

  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/projects/`);

      if (!response.ok) {
        throw new Error(
          `Failed to load projects (${response.status})`
        );
      }

      const data: Project[] = await response.json();

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
    try {
      const response = await fetch(`${API_URL}/clients/`);

      if (!response.ok) {
        throw new Error(
          `Failed to load clients (${response.status})`
        );
      }

      const data: Client[] = await response.json();

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
    try {
      const response = await fetch(
        `${API_URL}/pricing/products`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load products (${response.status})`
        );
      }

      const data: Product[] = await response.json();

      setProducts(
        data.filter((product) => product.active)
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
    try {
      const response = await fetch(
        `${API_URL}/pricing/addons`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load add-ons (${response.status})`
        );
      }

      const data: AddOn[] = await response.json();

      setAddons(
        data.filter((addon) => addon.active)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load add-ons"
      );
    }
  }

  async function loadProjectAddons(projectId: number) {
    try {
      const response = await fetch(
        `${API_URL}/projects/${projectId}/addons`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load project add-ons (${response.status})`
        );
      }

      const data: AddOn[] = await response.json();

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
  }, []);

  function openAddForm() {
    setEditingProject(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(project: Project) {
    setEditingProject(project);

    setForm({
      client_id: String(project.client_id),
      product_id: project.product_id
        ? String(project.product_id)
        : "",
      name: project.name,
      website: project.website ?? "",
      description: project.description ?? "",
      status: project.status,
      target_date: project.target_date ?? "",
      notes: project.notes ?? "",
    });

    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
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

    if (!form.client_id) {
      setError("Please select a client.");
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

      const selectedProduct = products.find(
        (product) =>
          product.id === Number(form.product_id)
      );

      if (!selectedProduct) {
        throw new Error(
          "Selected product could not be found."
        );
      }

      const payload = {
        client_id: Number(form.client_id),
        product_id: Number(form.product_id),
        plan: selectedProduct.name,
        name: form.name,
        website: form.website || null,
        description: form.description || null,
        status: form.status,
        target_date: form.target_date || null,
        notes: form.notes || null,
      };

      const url = editingProject
        ? `${API_URL}/projects/${editingProject.id}`
        : `${API_URL}/projects/`;

      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to ${
              editingProject ? "update" : "create"
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

  async function handleDelete(projectId: number) {
    const confirmed = window.confirm(
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
        const updated = { ...current };
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

  async function handleAddAddon(projectId: number) {
    const addonId = selectedAddon[projectId];

    if (!addonId) {
      setError("Please select an add-on first.");
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
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to add add-on (${response.status})`
        );
      }

      setSelectedAddon((current) => ({
        ...current,
        [projectId]: "",
      }));

      await loadProjectAddons(projectId);
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
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.detail ||
            `Failed to remove add-on (${response.status})`
        );
      }

      await loadProjectAddons(projectId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove add-on"
      );
    }
  }

  function getClientName(clientId: number) {
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

  function getProduct(productId: number | null) {
    if (!productId) {
      return null;
    }

    return (
      products.find(
        (item) => item.id === productId
      ) ?? null
    );
  }

  function getProductName(productId: number | null) {
    if (!productId) {
      return "No product assigned";
    }

    const product = getProduct(productId);

    return product
      ? product.name
      : `Product #${productId}`;
  }

  function getProductPrice(productId: number | null) {
    const product = getProduct(productId);

    return Number(
      product?.base_price ?? 0
    );
  }

  function getProjectTotal(projectId: number) {
    const project = projects.find(
      (item) => item.id === projectId
    );

    if (!project) {
      return 0;
    }

    const productPrice =
      getProductPrice(project.product_id);

    const addonTotal = (
      projectAddons[projectId] ?? []
    ).reduce(
      (total, addon) =>
        total + Number(addon.price ?? 0),
      0
    );

    return productPrice + addonTotal;
  }

  function getAssignedAddonIds(projectId: number) {
    return new Set(
      (projectAddons[projectId] ?? []).map(
        (addon) => addon.id
      )
    );
  }

  return (
    <div>
      <BackToDashboard />

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
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Client
                </option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.company
                      ? `${client.name} — ${client.company}`
                      : client.name}
                  </option>
                ))}
              </select>

              <select
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — R
                    {Number(
                      product.base_price ?? 0
                    ).toFixed(2)}
                  </option>
                ))}
              </select>

              <input
                name="name"
                placeholder="Project Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="website"
                type="url"
                placeholder="Website"
                value={form.website}
                onChange={handleChange}
              />

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

              <input
                name="target_date"
                type="date"
                value={form.target_date}
                onChange={handleChange}
              />
            </div>

            <textarea
              name="description"
              placeholder="Project Description"
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
                  : editingProject
                  ? "Update Project"
                  : "Create Project"}
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
        <div
          className="dashboard-panel"
          style={{
            marginBottom: "24px",
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {/* Project list */}
      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              PROJECT MANAGEMENT
            </p>

            <h3>All Projects</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadProjects}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p>Loading projects...</p>
        )}

        {!loading &&
          projects.length === 0 && (
            <p>No projects yet.</p>
          )}

        {!loading &&
          projects.length > 0 && (
            <div>
              {projects.map((project) => {
                const assignedAddons =
                  projectAddons[project.id] ?? [];

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
                    key={project.id}
                    style={{
                      padding: "24px 0",
                      borderBottom:
                        "1px solid #e5e5e5",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "1fr auto",
                        gap: "24px",
                        alignItems:
                          "start",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin:
                              "0 0 10px",
                          }}
                        >
                          {project.name}
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

                        <p>
                          Status:{" "}
                          {project.status}
                        </p>

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
                            {project.notes}
                          </p>
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
                            openEditForm(
                              project
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              project.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "24px",
                        padding: "20px",
                        border:
                          "1px solid #e5e5e5",
                        borderRadius: "8px",
                        background:
                          "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "20px",
                          marginBottom:
                            "16px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontWeight:
                                600,
                              margin: 0,
                            }}
                          >
                            Project Add-ons
                          </p>

                          <p
                            style={{
                              margin:
                                "6px 0 0",
                              fontSize:
                                "13px",
                              color:
                                "#777",
                            }}
                          >
                            Add-ons assigned
                            here will
                            automatically
                            be included
                            when an
                            invoice is
                            created for
                            this project.
                          </p>
                        </div>
                      </div>

                      {assignedAddons.length >
                      0 ? (
                        <div
                          style={{
                            display:
                              "grid",
                            gap: "10px",
                            marginBottom:
                              "16px",
                          }}
                        >
                          {assignedAddons.map(
                            (addon) => (
                              <div
                                key={
                                  addon.id
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
                                    "12px 14px",
                                  background:
                                    "#fff",
                                  border:
                                    "1px solid #e5e5e5",
                                  borderRadius:
                                    "6px",
                                }}
                              >
                                <div>
                                  <strong>
                                    {
                                      addon.name
                                    }
                                  </strong>

                                  {addon.description && (
                                    <p
                                      style={{
                                        margin:
                                          "4px 0 0",
                                        fontSize:
                                          "13px",
                                        color:
                                          "#777",
                                      }}
                                    >
                                      {
                                        addon.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap: "16px",
                                  }}
                                >
                                  <span>
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
                        <p
                          style={{
                            margin:
                              "0 0 16px",
                            color:
                              "#777",
                          }}
                        >
                          No add-ons assigned
                          to this project
                          yet.
                        </p>
                      )}

                      {availableForProject.length >
                        0 && (
                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "1fr auto",
                            gap: "10px",
                            alignItems:
                              "center",
                          }}
                        >
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
                          <p
                            style={{
                              margin:
                                "12px 0 0",
                              fontSize:
                                "13px",
                              color:
                                "#777",
                            }}
                          >
                            All available
                            add-ons are
                            already
                            assigned to
                            this project.
                          </p>
                        )}

                      <div
                        style={{
                          marginTop: "20px",
                          paddingTop: "16px",
                          borderTop:
                            "1px solid #ddd",
                          display: "flex",
                          justifyContent:
                            "space-between",
                          fontWeight: 700,
                        }}
                      >
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
              })}
            </div>
          )}
      </div>
    </div>
  );
}