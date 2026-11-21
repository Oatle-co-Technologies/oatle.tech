"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRecordPage } from "@/lib/use-record-page";
import BackToDashboard from "@/components/dashboard/BackToDashboard";

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

type Service = Product & { billing_period: string | null };

type Project = {
  id: number;
  name: string;
  product_id: number;
  client_id: number;
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
  service_id: number | null;
  service_name?: string | null;
  discount_percent: number;
  discount_fixed: number | null;
  amount: number;
  total_paid: number;
  balance_due: number;
  payments: Array<{
    id: number;
    amount: number;
    paid_at: string;
  }>;
  status: string;
  invoice_email_sent_at: string | null;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
};

type InvoiceForm = {
  billing_type: "project" | "service";
  service_id: string;
  client_id: string;
  project_id: string;
  quoted_amount: string;
  payment_amount: string;
  discount_percent: string;
  discount_type: "percent" | "fixed";
  discount_fixed: string;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string;
};

const emptyForm: InvoiceForm = {
  billing_type: "project",
  service_id: "",
  client_id: "",
  project_id: "",
  quoted_amount: "",

  payment_amount: "0",
  discount_percent: "0",
  discount_type: "percent",
  discount_fixed: "0",
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";

export default function Invoices() {
  const { userEmail } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);

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

  const recordPage = useRecordPage({
    base: "/dashboard/invoices", records: invoices, loading,
    onNew: initializeAddForm, onEdit: initializeEditForm,
    onReset: () => { setShowForm(false); },
  });
  function openAddForm() { recordPage.open("new"); }
  function openEditForm(invoice: Invoice) { recordPage.open("edit", invoice.id); }

  async function loadInvoices() {
    if (!userEmail) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/invoices`
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
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/clients`
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
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/projects`
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
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/pricing/products`
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

  async function loadServices() {
    if (!userEmail) return;
    try {
      const response = await fetch(`${API_URL}/pricing/services`);
      if (!response.ok) throw new Error("Failed to load services");
      setServices(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    }
  }

  async function loadAddOns() {
    if (!userEmail) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/pricing/addons`
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
    if (!userEmail) {
      return;
    }

    if (!projectId) {
      setProjectAddOns([]);
      return;
    }

    try {
      setLoadingAddOns(true);

      const response = await fetch(
        `${API_URL}/projects/${projectId}/addons`
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
    loadServices();
    loadAddOns();
  }, [userEmail]);

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
        `${API_URL}/projects/${form.project_id}/addons/${selectedAddonId}`,
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
        `${API_URL}/projects/${projectId}/addons/${addonId}`,
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
      ...(name === "billing_type" ? { project_id: "", service_id: "", quoted_amount: "" } : {}),
      ...(name === "service_id" || name === "project_id" ? { quoted_amount: "" } : {}),
      ...(name === "client_id" && !editingInvoice ? { project_id: "" } : {}),
    }));
  }

  function initializeAddForm() {
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

  function initializeEditForm(invoice: Invoice) {
    setEditingInvoice(invoice);

    setForm({
      billing_type: invoice.service_id ? "service" : "project",
      service_id: invoice.service_id ? String(invoice.service_id) : "",
      client_id: String(
        invoice.client_id
      ),

      project_id: invoice.project_id
        ? String(invoice.project_id)
        : "",

      quoted_amount: "",

      payment_amount: "0",

      discount_type: invoice.discount_fixed != null ? "fixed" : "percent",
      discount_fixed: String(invoice.discount_fixed ?? 0),
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
    recordPage.back();
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

        project_id: form.billing_type === "project" && form.project_id ? Number(form.project_id) : null,
        service_id: form.billing_type === "service" && form.service_id ? Number(form.service_id) : null,

        quoted_amount:
          form.quoted_amount.trim() !== ""
            ? Number(form.quoted_amount)
            : null,

        payment_amount: Number(
          form.payment_amount || 0
        ),

        discount_percent: form.discount_type === "percent" ? Number(form.discount_percent || 0) : 0,
        discount_fixed: form.discount_type === "fixed" ? Number(form.discount_fixed || 0) : null,

        status: form.status,

        issue_date:
          form.issue_date,

        due_date:
          form.due_date || null,

        notes:
          form.notes || null,
      };

      const url = editingInvoice
        ? `${API_URL}/invoices/${editingInvoice.id}`
        : `${API_URL}/invoices`;

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
        `${API_URL}/invoices/${invoiceId}`,
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

    if (!invoice.project_id && !invoice.service_id) {
      setError(
        "This invoice does not have a project or service assigned."
      );
      return;
    }

    const isResend = invoice.invoice_email_sent_at != null;
    const confirmed = window.confirm(
      `${isResend ? "Resend" : "Send"} ${invoice.invoice_number} to ${client.email}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSendingInvoiceId(
        invoice.id
      );

      setError("");

      const response = await fetch(`${API_URL}/invoices/${invoice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resend: isResend,
          expected_sent_at: invoice.invoice_email_sent_at,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Failed to send invoice.");
      }

      const result: { sent_copy_saved: boolean } = await response.json();
      await loadInvoices();

      alert(
        result.sent_copy_saved
          ? `Invoice ${invoice.invoice_number} was ${isResend ? "resent" : "sent"} successfully to ${client.email}.`
          : `Invoice ${invoice.invoice_number} was ${isResend ? "resent" : "sent"} to ${client.email}, but its Sent-folder copy could not be saved. Do not send it again; check PurelyMail before taking further action.`
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

  const selectedItem = form.billing_type === "service"
    ? services.find(item => item.id === Number(form.service_id))
    : getProjectProduct(Number(form.project_id) || null);
  const selectedPrice = selectedItem?.pricing_type === "quoted"
    ? Number(form.quoted_amount || 0)
    : selectedItem?.pricing_type === "starting" && form.quoted_amount.trim() !== ""
      ? Number(form.quoted_amount) : Number(selectedItem?.base_price || 0);
  const selectedSubtotal = selectedPrice + (form.billing_type === "project"
    ? projectAddOns.reduce((total, addon) => total + Number(addon.price), 0) : 0);
  const selectedDiscount = Number(form.discount_percent || 0);
  const subtotalCents = Math.round((selectedSubtotal + Number.EPSILON) * 100);
  const discountCents = form.discount_type === "fixed"
    ? Math.round(Number(form.discount_fixed || 0) * 100)
    : Math.round(subtotalCents * selectedDiscount / 100);
  const selectedTotal = (subtotalCents - discountCents) / 100;

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
    <div className={`dashboard-page${recordPage.isDetail ? " dashboard-record-detail" : ""}`}>
      {recordPage.isDetail ? recordPage.header : <BackToDashboard />}

      {/* Add Invoice */}

      <div className="dashboard-page-actions">
        <button
          type="button"
          className="dashboard-link"
          onClick={openAddForm}
        >
          + Add Invoice
        </button>
      </div>

      {/* Error */}

      {error && (
        <div className="dashboard-panel dashboard-error-panel">
          <p className="dashboard-error">
            {error}
          </p>
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

          <form onSubmit={handleSubmit}>
            <div className="dashboard-form-grid-wide">
              {/* Client */}

              <div className="dashboard-form-field">
                <label htmlFor="client_id">
                  Client
                </label>

                <select
                  id="client_id"
                  name="client_id"
                  value={form.client_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Client
                  </option>

                  {clients.map(
                    (client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="dashboard-form-field">
                <label htmlFor="billing_type">Invoice for</label>
                <select id="billing_type" name="billing_type" value={form.billing_type} onChange={handleChange} disabled={Boolean(editingInvoice)}>
                  <option value="project">Project / development package</option>
                  <option value="service">Standalone service</option>
                </select>
              </div>
              {form.billing_type === "service" && <div className="dashboard-form-field dashboard-form-field-full">
                <label htmlFor="service_id">Service</label>
                <select id="service_id" name="service_id" value={form.service_id} onChange={handleChange} required disabled={Boolean(editingInvoice)}>
                  <option value="">Select service</option>
                  {services.map(service => <option key={service.id} value={service.id}>{service.name} — {service.pricing_type === "quoted" ? "Quoted individually" : `${service.pricing_type === "starting" ? "From " : ""}R${Number(service.base_price).toFixed(2)}${service.billing_period === "month" ? "/month" : ""}`}</option>)}
                  {editingInvoice?.service_id && !services.some(item => item.id === editingInvoice.service_id) && <option value={editingInvoice.service_id}>{editingInvoice.service_name || `Service #${editingInvoice.service_id}`}</option>}
                </select>
                {selectedItem?.description && <p className="dashboard-form-help">{selectedItem.description}</p>}
                {services.find(item => item.id === Number(form.service_id))?.billing_period === "month" && <p className="dashboard-form-help">This invoice covers one month. It does not set up automatic recurring billing.</p>}
              </div>}
              {form.billing_type === "project" && <>
              {/* Project */}

              <div className="dashboard-form-field">
                <label htmlFor="project_id">
                  Project
                </label>

                <select
                  id="project_id"
                  name="project_id"
                  value={form.project_id}
                  onChange={handleChange}
                  required
                  disabled={Boolean(editingInvoice)}
                >
                  <option value="">
                    Select Project
                  </option>

                  {projects.filter(project => !form.client_id || project.client_id === Number(form.client_id)).map(
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
              </div>

              </>}

              {!editingInvoice && selectedItem && ["quoted", "starting"].includes(selectedItem.pricing_type) && (
                <div className="dashboard-form-field dashboard-form-field-full">
                  <label htmlFor="quoted_amount">{selectedItem.pricing_type === "starting" ? "Agreed price" : "Quoted amount"}</label>
                  <div className="dashboard-input-prefix"><span>R</span>
                    <input id="quoted_amount" name="quoted_amount" type="number" step="0.01"
                      min={selectedItem.pricing_type === "starting" ? selectedItem.base_price || 0 : 0}
                      value={form.quoted_amount} onChange={handleChange}
                      placeholder={selectedItem.pricing_type === "starting" ? `From R${selectedItem.base_price}` : "Enter quoted amount"}
                      required={selectedItem.pricing_type === "quoted"} />
                  </div>
                  {selectedItem.pricing_type === "starting" && <p className="dashboard-form-help">Leave blank to use the published starting price. Use the discount field for an agreed reduction.</p>}
                </div>
              )}

              {(selectedItem || editingInvoice) && (
                <div className="dashboard-form-section dashboard-form-field-full">
                  <p className="dashboard-form-section-title">Invoice breakdown</p>
                  {editingInvoice ? (
                    <p>Saved invoice total: R{Number(editingInvoice.amount).toFixed(2)}. Catalogue price changes do not change this invoice.</p>
                  ) : <>
                    <div className="dashboard-breakdown-row"><span>{selectedItem?.name}</span><span>R{selectedPrice.toFixed(2)}</span></div>
                    {form.billing_type === "project" && projectAddOns.map(addon => <div key={addon.id} className="dashboard-breakdown-row"><span>{addon.name}</span><span>R{Number(addon.price).toFixed(2)}</span></div>)}
                    <div className="dashboard-breakdown-row dashboard-breakdown-subtotal"><span>Subtotal</span><span>R{selectedSubtotal.toFixed(2)}</span></div>
                    <div className="dashboard-breakdown-row"><span>{form.discount_type === "fixed" ? "Discount (fixed amount)" : `Discount (${selectedDiscount}%)`}</span><span>− R{(selectedSubtotal - selectedTotal).toFixed(2)}</span></div>
                    <div className="dashboard-breakdown-total"><span>Invoice total</span><span>R{selectedTotal.toFixed(2)}</span></div>
                  </>}
                  {form.billing_type === "project" && !editingInvoice && <>
                  <div className="dashboard-form-subsection">
                    <p className="dashboard-form-section-title">
                      Project Add-ons
                    </p>

                    <div className="dashboard-addon-controls">
                      <select
                        value={
                          selectedAddonId
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedAddonId(
                            event.target.value
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
                            (addon) =>
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
                        className="dashboard-action-primary"
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
                      <p className="dashboard-muted">
                        Loading project
                        add-ons...
                      </p>
                    )}

                    {!loadingAddOns &&
                      projectAddOns.length ===
                        0 && (
                        <p className="dashboard-muted">
                          No add-ons
                          assigned to this
                          project yet.
                        </p>
                      )}

                    {!loadingAddOns &&
                      projectAddOns.length >
                        0 && (
                        <div className="dashboard-addon-list">
                          {projectAddOns.map(
                            (addon) => (
                              <div
                                key={
                                  addon.id
                                }
                                className="dashboard-addon-row"
                              >
                                <div>
                                  <strong>
                                    {
                                      addon.name
                                    }
                                  </strong>

                                  {addon.description && (
                                    <p className="dashboard-form-help">
                                      {
                                        addon.description
                                      }
                                    </p>
                                  )}
                                </div>

                                <div className="dashboard-addon-actions">
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
                                    className="dashboard-action-delete"
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

                    <p className="dashboard-form-help">
                      Add-ons are assigned
                      to the project and
                      are included
                      automatically in the
                      invoice calculation.
                    </p>
                  </div>
                  </>}
                </div>
              )}

              {/* Discount */}
              <div className="dashboard-form-field">
                <label htmlFor="discount_type">Discount type</label>
                <select id="discount_type" name="discount_type" value={form.discount_type}
                  onChange={handleChange} disabled={Boolean(editingInvoice)}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount (R)</option>
                </select>
              </div>
              <div className="dashboard-form-field">
                <label htmlFor={form.discount_type === "fixed" ? "discount_fixed" : "discount_percent"}>
                  {form.discount_type === "fixed" ? "Discount amount" : "Discount percentage"}
                </label>
                <div className="dashboard-input-prefix">
                  {form.discount_type === "fixed" && <span>R</span>}
                  <input id={form.discount_type === "fixed" ? "discount_fixed" : "discount_percent"}
                    name={form.discount_type === "fixed" ? "discount_fixed" : "discount_percent"}
                    disabled={Boolean(editingInvoice)} type="number" min="0" step="0.01"
                    max={form.discount_type === "fixed" ? selectedSubtotal.toFixed(2) : "100"}
                    value={form.discount_type === "fixed" ? form.discount_fixed : form.discount_percent}
                    onChange={handleChange} />
                  {form.discount_type === "percent" && <span>%</span>}
                </div>
                {!editingInvoice && form.discount_type === "fixed" && <p className="dashboard-form-help">
                  Enter the amount to subtract, for example R50.00 off R350.00 gives R300.00.
                </p>}
              </div>

              {/* Status */}

              <div className="dashboard-form-field">
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status
                          .charAt(0)
                          .toUpperCase() +
                          status.slice(1)}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Issue Date */}

              <div className="dashboard-form-field">
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

              <div className="dashboard-form-field">
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

            <div className="dashboard-form-field dashboard-form-field-full">
              <label htmlFor="payment_amount">
                New Payment
              </label>

              <div>
                <div className="dashboard-input-prefix">
                  <span>R</span>

                  <input
                    id="payment_amount"
                    name="payment_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.payment_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>

                <p className="dashboard-form-help">
                  Enter only this installment. Previous payments are kept and added automatically.
                </p>
              </div>
            </div>

            {editingInvoice && (
              <div className="dashboard-info-box">
                <strong>
                  Invoice total:
                </strong>{" "}
                R
                {Number(
                  editingInvoice.amount
                ).toFixed(2)}
                <br />
                <strong>Amount paid:</strong>{" "}
                R
                {Number(
                  editingInvoice.total_paid
                ).toFixed(2)}
                <br />
                <strong>Amount remaining:</strong>{" "}
                R
                {Number(
                  editingInvoice.balance_due
                ).toFixed(2)}
              </div>
            )}

            {/* Notes */}

            <div className="dashboard-form-field dashboard-form-field-full dashboard-form-notes">
              <label htmlFor="notes">
                Notes
              </label>

              <textarea
                id="notes"
                name="notes"
                placeholder="Add any notes for this invoice..."
                value={form.notes}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* Actions */}

            <div className="dashboard-form-actions">
              <button
                type="submit"
                className="dashboard-action-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingInvoice
                  ? "Update Invoice"
                  : "Create Invoice"}
              </button>

              <button
                type="button"
                className="dashboard-action-secondary"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {recordPage.showList && <>
      {/* Invoice List */}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              FINANCIAL MANAGEMENT
            </p>

            <h3>Invoices</h3>
          </div>

          <button
            type="button"
            className="dashboard-link"
            onClick={loadInvoices}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="dashboard-muted">
            Loading invoices...
          </p>
        )}

        {!loading &&
          invoices.length === 0 && (
            <p className="dashboard-muted">
              No invoices yet.
            </p>
          )}

        {!loading &&
          invoices.filter(item => !recordPage.isDetail || item.id === recordPage.id).map((invoice) => {
            const product =
              getProjectProduct(
                invoice.project_id
              );

            return (
              <div
                key={invoice.id}
                className="dashboard-list-row dashboard-invoice-row"
              >
                <div className="dashboard-list-content">
                  <h2>
                    {invoice.invoice_number}
                  </h2>

                  <p>
                    Client:{" "}
                    {getClientName(
                      invoice.client_id
                    )}
                  </p>

                  <p>
                    {invoice.service_id ? "Service: " : "Project: "}
                    {invoice.service_id ? (services.find(item => item.id === invoice.service_id)?.name || invoice.service_name || `Service #${invoice.service_id}`) : getProjectName(invoice.project_id)}
                  </p>

                  {product && (
                    <p>
                      Product:{" "}
                      {product.name}

                      {product.base_price !==
                        null &&
                        ` — R${Number(
                          product.base_price
                        ).toFixed(2)}`}
                    </p>
                  )}

                  <p>
                    Total: R
                    {Number(
                      invoice.amount
                    ).toFixed(2)}
                  </p>

                  <p>
                    Paid: R
                    {Number(
                      invoice.total_paid
                    ).toFixed(2)}
                  </p>

                  <p>
                    Remaining: R
                    {Number(
                      invoice.balance_due
                    ).toFixed(2)}
                  </p>

                  {invoice.payments.length > 0 && (
                    <p>
                      Installments: {invoice.payments.length}
                    </p>
                  )}

                  <p>
                    Discount:{" "}
                    {invoice.discount_fixed != null ? `R${Number(invoice.discount_fixed).toFixed(2)}` : `${invoice.discount_percent}%`}
                  </p>

                  <div className="dashboard-list-status">
                    <span
                      className={getStatusClass(
                        invoice.status
                      )}
                    >
                      {invoice.status}
                    </span>
                  </div>

                  <p>
                    Issue date:{" "}
                    {invoice.issue_date}
                  </p>

                  {invoice.due_date && (
                    <p>
                      Due date:{" "}
                      {invoice.due_date}
                    </p>
                  )}

                  {invoice.paid_at && (
                    <p>
                      Paid:{" "}
                      {invoice.paid_at}
                    </p>
                  )}

                  {invoice.notes && (
                    <p>
                      {invoice.notes}
                    </p>
                  )}
                </div>

                <div className="dashboard-list-actions">
                  <button
                    type="button"
                    className="dashboard-action-edit"
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
                    className="dashboard-action-delete"
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
                    className="dashboard-action-primary"
                    onClick={() => handleSendInvoice(invoice)}
                    disabled={
                      sendingInvoiceId ===
                      invoice.id
                    }
                  >
                    {sendingInvoiceId ===
                    invoice.id
                      ? "Sending..."
                      : invoice.invoice_email_sent_at != null
                      ? "Resend Invoice"
                      : "Send Invoice"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      </>}
    </div>
  );
}
