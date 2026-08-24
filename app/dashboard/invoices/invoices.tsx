"use client";

import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

type Client = {
  id: number;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  base_price: number | null;
  pricing_type: string;
  active: boolean;
};

type Project = {
  id: number;
  name: string;
  product_id: number;
  website?: string | null;
  plan?: string | null;
  description?: string | null;
  status?: string;
  target_date?: string | null;
  notes?: string | null;
};

type AddOn = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  active?: boolean;
};

type Invoice = {
  id: number;
  invoice_number: string;
  client_id: number;
  project_id: number | null;
  discount_percent: number;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
};

type InvoiceForm = {
  client_id: string;
  project_id: string;
  discount_percent: string;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string;
};

const emptyForm: InvoiceForm = {
  client_id: "",
  project_id: "",
  discount_percent: "0",
  status: "draft",
  issue_date: "",
  due_date: "",
  notes: "",
};

const statuses = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

const EMAILJS_SERVICE_ID = "service_4mg8nys";
const EMAILJS_INVOICE_TEMPLATE_ID = "template_x1bok19";
const EMAILJS_PUBLIC_KEY = "G21rP3jrxQohCHe1l";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [projectAddOns, setProjectAddOns] =
    useState<AddOn[]>([]);

  const [allAddOns, setAllAddOns] =
    useState<AddOn[]>([]);

  const [selectedAddonId, setSelectedAddonId] =
    useState("");

  const [loadingAddOns, setLoadingAddOns] =
    useState(false);

  const [addingAddon, setAddingAddon] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingInvoice, setEditingInvoice] =
    useState<Invoice | null>(null);

  const [form, setForm] =
    useState<InvoiceForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [sendingInvoiceId, setSendingInvoiceId] =
    useState<number | null>(null);

  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/invoices/"
      );

      if (!response.ok) {
        throw new Error("Failed to load invoices");
      }

      const data: Invoice[] =
        await response.json();

      setInvoices(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/clients/"
      );

      if (!response.ok) {
        throw new Error("Failed to load clients");
      }

      const data: Client[] =
        await response.json();

      setClients(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/projects/"
      );

      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data: Project[] =
        await response.json();

      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pricing/products"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load products"
        );
      }

      const data: Product[] =
        await response.json();

      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAddOns() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pricing/addons"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load add-ons"
        );
      }

      const data: AddOn[] =
        await response.json();

      setAllAddOns(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProjectAddOns(
    projectId: string
  ) {
    if (!projectId) {
      setProjectAddOns([]);
      return;
    }

    try {
      setLoadingAddOns(true);

      const response = await fetch(
        `http://127.0.0.1:8000/projects/${projectId}/addons`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load project add-ons"
        );
      }

      const data: AddOn[] =
        await response.json();

      setProjectAddOns(data);
    } catch (err) {
      console.error(err);
      setProjectAddOns([]);
    } finally {
      setLoadingAddOns(false);
    }
  }

  useEffect(() => {
    loadInvoices();
    loadClients();
    loadProjects();
    loadProducts();
    loadAddOns();
  }, []);

  useEffect(() => {
    loadProjectAddOns(form.project_id);
  }, [form.project_id]);

  async function handleAddAddonToProject() {
    if (!form.project_id) {
      setError(
        "Select a project before adding an add-on."
      );
      return;
    }

    if (!selectedAddonId) {
      setError(
        "Select an add-on to add to this project."
      );
      return;
    }

    try {
      setAddingAddon(true);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/projects/${form.project_id}/addons/${selectedAddonId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.detail ||
            "Failed to add add-on to project"
        );
      }

      setSelectedAddonId("");

      await loadProjectAddOns(
        form.project_id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add add-on to project"
      );
    } finally {
      setAddingAddon(false);
    }
  }

  async function handleRemoveAddon(
    projectId: string,
    addonId: number
  ) {
    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/projects/${projectId}/addons/${addonId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.detail ||
            "Failed to remove add-on"
        );
      }

      await loadProjectAddOns(projectId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove add-on"
      );
    }
  }

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openAddForm() {
    setEditingInvoice(null);

    setForm({
      ...emptyForm,
      issue_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setProjectAddOns([]);
    setSelectedAddonId("");

    setShowForm(true);
    setError("");
  }

  function openEditForm(
    invoice: Invoice
  ) {
    setEditingInvoice(invoice);

    setForm({
      client_id: String(
        invoice.client_id
      ),

      project_id: invoice.project_id
        ? String(invoice.project_id)
        : "",

      discount_percent: String(
        invoice.discount_percent ?? 0
      ),

      status: invoice.status,

      issue_date:
        invoice.issue_date,

      due_date:
        invoice.due_date ?? "",

      notes:
        invoice.notes ?? "",
    });

    setSelectedAddonId("");
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingInvoice(null);
    setForm(emptyForm);
    setProjectAddOns([]);
    setSelectedAddonId("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        client_id:
          Number(form.client_id),

        project_id: form.project_id
          ? Number(form.project_id)
          : null,

        discount_percent:
          Number(
            form.discount_percent || 0
          ),

        status: form.status,

        issue_date:
          form.issue_date,

        due_date:
          form.due_date || null,

        notes:
          form.notes || null,
      };

      const url = editingInvoice
        ? `http://127.0.0.1:8000/invoices/${editingInvoice.id}`
        : "http://127.0.0.1:8000/invoices/";

      const method = editingInvoice
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
        const data =
          await response.json();

        throw new Error(
          data.detail ||
            "Failed to save invoice"
        );
      }

      closeForm();

      await loadInvoices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save invoice"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    invoiceId: number
  ) {
    if (
      !window.confirm(
        "Are you sure you want to delete this invoice?"
      )
    ) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/invoices/${invoiceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete invoice"
        );
      }

      await loadInvoices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete invoice"
      );
    }
  }

  async function handleSendInvoice(
    invoice: Invoice
  ) {
    const client = clients.find(
      (item) =>
        item.id === invoice.client_id
    );

    if (!client) {
      setError(
        "The client for this invoice could not be found."
      );
      return;
    }

    if (!client.email) {
      setError(
        "This client does not have an email address."
      );
      return;
    }

    if (!invoice.project_id) {
      setError(
        "This invoice does not have a project assigned."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Send ${invoice.invoice_number} to ${client.email}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSendingInvoiceId(
        invoice.id
      );

      setError("");

      /*
       * ----------------------------------------
       * Load project
       * ----------------------------------------
       */

      const projectResponse =
        await fetch(
          `http://127.0.0.1:8000/projects/${invoice.project_id}`
        );

      if (!projectResponse.ok) {
        throw new Error(
          "Failed to load the project for this invoice."
        );
      }

      const project: Project =
        await projectResponse.json();

      /*
       * ----------------------------------------
       * Find product
       * ----------------------------------------
       */

      const product =
        products.find(
          (item) =>
            item.id ===
            project.product_id
        );

      if (!product) {
        throw new Error(
          "The product assigned to this project could not be found."
        );
      }

      if (
        product.base_price ===
        null
      ) {
        throw new Error(
          "The selected product does not have a base price."
        );
      }

      /*
       * ----------------------------------------
       * Load project add-ons
       * ----------------------------------------
       */

      const addonsResponse =
        await fetch(
          `http://127.0.0.1:8000/projects/${invoice.project_id}/addons`
        );

      if (!addonsResponse.ok) {
        throw new Error(
          "Failed to load project add-ons."
        );
      }

      const addons: AddOn[] =
        await addonsResponse.json();

      /*
       * ----------------------------------------
       * Calculate breakdown
       * ----------------------------------------
       */

      const productPrice =
        Number(
          product.base_price
        );

      const addonsTotal =
        addons.reduce(
          (
            total,
            addon
          ) =>
            total +
            Number(
              addon.price
            ),
          0
        );

      const subtotal =
        productPrice +
        addonsTotal;

      const discountPercent =
        Number(
          invoice.discount_percent ??
            0
        );

      const discountAmount =
        subtotal *
        (discountPercent / 100);

      /*
       * invoice.amount is the amount
       * calculated and stored by the
       * backend.
       */
      const amountDue =
        Number(invoice.amount);

      /*
       * ----------------------------------------
       * Format add-ons for email
       * ----------------------------------------
       */

      const addonsText =
        addons.length > 0
          ? addons
              .map(
                (addon) =>
                  `${addon.name} — R${Number(
                    addon.price
                  ).toFixed(2)}`
              )
              .join("\n")
          : "No add-ons";

      /*
       * ----------------------------------------
       * EmailJS
       * ----------------------------------------
       */

      const templateParams = {
        to_email:
          client.email,

        client_email:
          client.email,

        invoice_number:
          invoice.invoice_number,

        client_name:
          client.name,

        project_name:
          project.name,

        product_name:
          product.name,

        product_price:
          productPrice.toFixed(2),

        addons:
          addonsText,

        subtotal:
          subtotal.toFixed(2),

        discount_percent:
          discountPercent.toFixed(2),

        discount_amount:
          discountAmount.toFixed(2),

        amount:
          amountDue.toFixed(2),

        issue_date:
          invoice.issue_date,

        due_date:
          invoice.due_date ||
          "Not specified",

        notes:
          invoice.notes ||
          project.notes ||
          "Thank you for choosing Oatle Technologies.",
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_INVOICE_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      /*
       * ----------------------------------------
       * Mark invoice as sent
       * ----------------------------------------
       */

      const updatePayload = {
        client_id:
          invoice.client_id,

        project_id:
          invoice.project_id,

        discount_percent:
          invoice.discount_percent ??
          0,

        status: "sent",

        issue_date:
          invoice.issue_date,

        due_date:
          invoice.due_date,

        notes:
          invoice.notes,
      };

      const updateResponse =
        await fetch(
          `http://127.0.0.1:8000/invoices/${invoice.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              updatePayload
            ),
          }
        );

      if (!updateResponse.ok) {
        const data =
          await updateResponse.json();

        throw new Error(
          data.detail ||
            "Invoice was emailed, but the status could not be updated."
        );
      }

      await loadInvoices();

      alert(
        `Invoice ${invoice.invoice_number} was sent successfully to ${client.email}.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send invoice."
      );
    } finally {
      setSendingInvoiceId(
        null
      );
    }
  }

  function getClientName(
    clientId: number
  ) {
    return (
      clients.find(
        (client) =>
          client.id === clientId
      )?.name ||
      `Client #${clientId}`
    );
  }

  function getProjectName(
    projectId: number | null
  ) {
    if (!projectId) {
      return "No project";
    }

    return (
      projects.find(
        (project) =>
          project.id === projectId
      )?.name ||
      `Project #${projectId}`
    );
  }

  function getProjectProduct(
    projectId: number | null
  ) {
    if (!projectId) {
      return null;
    }

    const project =
      projects.find(
        (item) =>
          item.id === projectId
      );

    if (!project) {
      return null;
    }

    return (
      products.find(
        (product) =>
          product.id ===
          project.product_id
      ) || null
    );
  }

  return (
    <div>
      {/* Add Invoice */}

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
          className="dashboard-link"
          onClick={
            openAddForm
          }
        >
          + Add Invoice
        </button>
      </div>

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

      {/* Invoice Form */}

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
                {editingInvoice
                  ? "EDIT INVOICE"
                  : "NEW INVOICE"}
              </p>

              <h3>
                {editingInvoice
                  ? "Edit Invoice"
                  : "Create Invoice"}
              </h3>
            </div>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "20px 32px",
              }}
            >
              {/* Client */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "120px 1fr",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <label htmlFor="client_id">
                  Client
                </label>

                <select
                  id="client_id"
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
                        {client.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Project */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "120px 1fr",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <label htmlFor="project_id">
                  Project
                </label>

                <select
                  id="project_id"
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

                  {projects.map(
                    (project) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        {project.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Invoice Pricing Breakdown */}

              {form.project_id && (
                <div
                  style={{
                    gridColumn:
                      "1 / -1",
                    padding:
                      "18px 0",
                    borderTop:
                      "1px solid #e5e5e5",
                    borderBottom:
                      "1px solid #e5e5e5",
                  }}
                >
                  <p
                    style={{
                      margin:
                        "0 0 16px",
                      fontWeight: 600,
                    }}
                  >
                    Invoice Breakdown
                  </p>

                  {(() => {
                    const project =
                      projects.find(
                        (item) =>
                          item.id ===
                          Number(
                            form.project_id
                          )
                      );

                    const product =
                      project
                        ? products.find(
                            (
                              item
                            ) =>
                              item.id ===
                              project.product_id
                          )
                        : null;

                    const productPrice =
                      product?.base_price
                        ? Number(
                            product.base_price
                          )
                        : 0;

                    const addonsTotal =
                      projectAddOns.reduce(
                        (
                          total,
                          addon
                        ) =>
                          total +
                          Number(
                            addon.price
                          ),
                        0
                      );

                    const subtotal =
                      productPrice +
                      addonsTotal;

                    const discount =
                      Number(
                        form.discount_percent ||
                          0
                      );

                    const discountAmount =
                      subtotal *
                      (discount /
                        100);

                    const amountDue =
                      subtotal -
                      discountAmount;

                    return (
                      <div>
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            padding:
                              "10px 0",
                          }}
                        >
                          <span>
                            {product?.name ||
                              "Product"}
                          </span>

                          <span>
                            R
                            {productPrice.toFixed(
                              2
                            )}
                          </span>
                        </div>

                        {projectAddOns.map(
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
                                padding:
                                  "10px 0",
                                borderTop:
                                  "1px solid #e5e5e5",
                              }}
                            >
                              <span>
                                {addon.name}
                              </span>

                              <span>
                                R
                                {Number(
                                  addon.price
                                ).toFixed(
                                  2
                                )}
                              </span>
                            </div>
                          )
                        )}

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            padding:
                              "12px 0",
                            borderTop:
                              "1px solid #e5e5e5",
                            fontWeight:
                              600,
                          }}
                        >
                          <span>
                            Subtotal
                          </span>

                          <span>
                            R
                            {subtotal.toFixed(
                              2
                            )}
                          </span>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            padding:
                              "10px 0",
                          }}
                        >
                          <span>
                            Discount (
                            {discount}
                            %)
                          </span>

                          <span>
                            - R
                            {discountAmount.toFixed(
                              2
                            )}
                          </span>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            padding:
                              "16px 0 0",
                            marginTop:
                              "6px",
                            borderTop:
                              "2px solid #171717",
                            fontWeight:
                              700,
                            fontSize:
                              "18px",
                          }}
                        >
                          <span>
                            Amount Due
                          </span>

                          <span>
                            R
                            {amountDue.toFixed(
                              2
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add-ons */}

                  <div
                    style={{
                      marginTop:
                        "24px",
                      paddingTop:
                        "18px",
                      borderTop:
                        "1px solid #e5e5e5",
                    }}
                  >
                    <p
                      style={{
                        margin:
                          "0 0 12px",
                        fontWeight: 600,
                      }}
                    >
                      Project Add-ons
                    </p>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr auto",
                        gap: "12px",
                        alignItems:
                          "center",
                        marginBottom:
                          "16px",
                      }}
                    >
                      <select
                        value={
                          selectedAddonId
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedAddonId(
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          addingAddon ||
                          allAddOns.length ===
                            0
                        }
                      >
                        <option value="">
                          Select an add-on to add
                        </option>

                        {allAddOns
                          .filter(
                            (
                              addon
                            ) =>
                              addon.active !==
                                false &&
                              !projectAddOns.some(
                                (
                                  assigned
                                ) =>
                                  assigned.id ===
                                  addon.id
                              )
                          )
                          .map(
                            (
                              addon
                            ) => (
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
                                  addon.price
                                ).toFixed(
                                  2
                                )}
                              </option>
                            )
                          )}
                      </select>

                      <button
                        type="button"
                        onClick={
                          handleAddAddonToProject
                        }
                        disabled={
                          addingAddon ||
                          !selectedAddonId
                        }
                      >
                        {addingAddon
                          ? "Adding..."
                          : "Add Add-on"}
                      </button>
                    </div>

                    {loadingAddOns && (
                      <p>
                        Loading project
                        add-ons...
                      </p>
                    )}

                    {!loadingAddOns &&
                      projectAddOns.length ===
                        0 && (
                        <p
                          style={{
                            margin: 0,
                            color:
                              "#777",
                          }}
                        >
                          No add-ons
                          assigned to this
                          project yet.
                        </p>
                      )}

                    {!loadingAddOns &&
                      projectAddOns.length >
                        0 && (
                        <div
                          style={{
                            display:
                              "grid",
                            gap:
                              "10px",
                          }}
                        >
                          {projectAddOns.map(
                            (
                              addon
                            ) => (
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
                                  gap:
                                    "20px",
                                  padding:
                                    "12px 0",
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
                                        color:
                                          "#777",
                                        fontSize:
                                          "14px",
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
                                    gap:
                                      "16px",
                                  }}
                                >
                                  <span>
                                    R
                                    {Number(
                                      addon.price
                                    ).toFixed(
                                      2
                                    )}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveAddon(
                                        form.project_id,
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
                      )}

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
                      Add-ons are assigned
                      to the project and
                      are included
                      automatically in the
                      invoice calculation.
                    </p>
                  </div>
                </div>
              )}

              {/* Discount */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "120px 1fr",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <label htmlFor="discount_percent">
                  Discount
                </label>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "8px",
                  }}
                >
                  <input
                    id="discount_percent"
                    name="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      form.discount_percent
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>%</span>
                </div>
              </div>

              {/* Status */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "120px 1fr",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
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
                        {status
                          .charAt(
                            0
                          )
                          .toUpperCase() +
                          status.slice(
                            1
                          )}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Issue Date */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "120px 1fr",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <label htmlFor="issue_date">
                  Issue Date
                </label>

                <input
                  id="issue_date"
                  name="issue_date"
                  type="date"
                  value={
                    form.issue_date
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              {/* Due Date */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "120px 1fr",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <label htmlFor="due_date">
                  Due Date
                </label>

                <input
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={
                    form.due_date
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </div>

            {/* Existing Invoice Amount */}

            {editingInvoice && (
              <div
                style={{
                  marginTop:
                    "20px",
                  padding:
                    "16px",
                  borderRadius:
                    "8px",
                  background:
                    "#f5f5f5",
                }}
              >
                <strong>
                  Current invoice
                  amount:
                </strong>{" "}
                R
                {Number(
                  editingInvoice.amount
                ).toFixed(2)}
              </div>
            )}

            {/* Notes */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "120px 1fr",
                gap: "12px",
                marginTop:
                  "20px",
                alignItems:
                  "start",
              }}
            >
              <label
                htmlFor="notes"
                style={{
                  paddingTop:
                    "10px",
                }}
              >
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Add any notes for this invoice..."
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
                rows={4}
                style={{
                  width: "100%",
                }}
              />
            </div>

            {/* Actions */}

            <div
              style={{
                display:
                  "flex",
                gap: "12px",
                marginTop:
                  "24px",
                paddingTop:
                  "20px",
                borderTop:
                  "1px solid #e5e5e5",
              }}
            >
              <button
                type="submit"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : editingInvoice
                  ? "Update Invoice"
                  : "Create Invoice"}
              </button>

              <button
                type="button"
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

      {/* Invoice List */}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              FINANCIAL MANAGEMENT
            </p>

            <h3>
              Invoices
            </h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={
              loadInvoices
            }
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p>
            Loading invoices...
          </p>
        )}

        {!loading &&
          invoices.length ===
            0 && (
            <p>
              No invoices yet.
            </p>
          )}

        {!loading &&
          invoices.map(
            (invoice) => {
              const product =
                getProjectProduct(
                  invoice.project_id
                );

              return (
                <div
                  key={
                    invoice.id
                  }
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr auto",
                    gap: "24px",
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
                      {
                        invoice.invoice_number
                      }
                    </h2>

                    <p>
                      Client:{" "}
                      {getClientName(
                        invoice.client_id
                      )}
                    </p>

                    <p>
                      Project:{" "}
                      {getProjectName(
                        invoice.project_id
                      )}
                    </p>

                    {product && (
                      <p>
                        Product:{" "}
                        {
                          product.name
                        }

                        {product.base_price !==
                          null &&
                          ` — R${Number(
                            product.base_price
                          ).toFixed(
                            2
                          )}`}
                      </p>
                    )}

                    <p>
                      Amount: R
                      {Number(
                        invoice.amount
                      ).toFixed(
                        2
                      )}
                    </p>

                    <p>
                      Discount:{" "}
                      {
                        invoice.discount_percent
                      }
                      %
                    </p>

                    <p>
                      Status:{" "}
                      {
                        invoice.status
                      }
                    </p>

                    <p>
                      Issue date:{" "}
                      {
                        invoice.issue_date
                      }
                    </p>

                    {invoice.due_date && (
                      <p>
                        Due date:{" "}
                        {
                          invoice.due_date
                        }
                      </p>
                    )}

                    {invoice.paid_at && (
                      <p>
                        Paid:{" "}
                        {
                          invoice.paid_at
                        }
                      </p>
                    )}

                    {invoice.notes && (
                      <p>
                        {
                          invoice.notes
                        }
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "10px",
                      alignItems:
                        "flex-start",
                      flexWrap:
                        "wrap",
                      justifyContent:
                        "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          invoice
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          invoice.id
                        )
                      }
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendInvoice(
                          invoice
                        )
                      }
                      disabled={
                        sendingInvoiceId ===
                        invoice.id
                      }
                    >
                      {sendingInvoiceId ===
                      invoice.id
                        ? "Sending..."
                        : invoice.status ===
                          "sent"
                        ? "Resend Invoice"
                        : "Send Invoice"}
                    </button>
                  </div>
                </div>
              );
            }
          )}
      </div>
    </div>
  );
}