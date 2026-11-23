
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  RefreshCw,
  Search,
  Puzzle,
  X,
  Check,
  AlertCircle,
  Power,
} from "lucide-react";

type PackageTemplate = {
  _id: string;
  templateCode: string;
  packageName: string;
  category: "basic" | "standard" | "premium" | "vip";
  description: string;
  basePrice: number;
  services: string[];
  deliverables: string[];
  isActive: boolean;
  sortOrder: number;
};

type PackageAddon = {
  _id: string;
  addonCode: string;
  name: string;
  description: string;
  category: string;
  defaultPrice: number;
  isActive: boolean;
  sortOrder: number;
};

type CatalogueTab = "templates" | "addons";
type FormMode = "create" | "edit";

const emptyTemplate = {
  templateCode: "",
  packageName: "",
  category: "basic" as PackageTemplate["category"],
  description: "",
  basePrice: "",
  servicesText: "",
  deliverablesText: "",
  sortOrder: "0",
};

const emptyAddon = {
  addonCode: "",
  name: "",
  description: "",
  category: "other",
  defaultPrice: "",
  sortOrder: "0",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getErrorMessage(data: any, fallback: string) {
  return data?.message || data?.error || fallback;
}

export default function FinalPackageCatalogueSection() {
  const [activeTab, setActiveTab] = useState<CatalogueTab>("templates");
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [addons, setAddons] = useState<PackageAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [addonForm, setAddonForm] = useState(emptyAddon);

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [templateResponse, addonResponse] = await Promise.all([
        fetch("/api/final-packages/templates", { cache: "no-store" }),
        fetch("/api/final-packages/addons", { cache: "no-store" }),
      ]);

      const templateData = await templateResponse.json();
      const addonData = await addonResponse.json();

      if (!templateResponse.ok) {
        throw new Error(
          getErrorMessage(templateData, "Unable to load package templates.")
        );
      }

      if (!addonResponse.ok) {
        throw new Error(
          getErrorMessage(addonData, "Unable to load add-ons.")
        );
      }

      setTemplates(
        Array.isArray(templateData.templates) ? templateData.templates : []
      );

      setAddons(Array.isArray(addonData.addons) ? addonData.addons : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load catalogue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setTemplateForm(emptyTemplate);
    setAddonForm(emptyAddon);
  };

  const openNewTemplate = () => {
    setFormMode("create");
    setEditingId(null);
    setTemplateForm(emptyTemplate);
    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const openEditTemplate = (item: PackageTemplate) => {
    setFormMode("edit");
    setEditingId(item._id);

    setTemplateForm({
      templateCode: item.templateCode || "",
      packageName: item.packageName || "",
      category: item.category || "basic",
      description: item.description || "",
      basePrice: String(item.basePrice ?? ""),
      servicesText: (item.services || []).join("\n"),
      deliverablesText: (item.deliverables || []).join("\n"),
      sortOrder: String(item.sortOrder ?? 0),
    });

    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const openNewAddon = () => {
    setFormMode("create");
    setEditingId(null);
    setAddonForm(emptyAddon);
    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const openEditAddon = (item: PackageAddon) => {
    setFormMode("edit");
    setEditingId(item._id);

    setAddonForm({
      addonCode: item.addonCode || "",
      name: item.name || "",
      description: item.description || "",
      category: item.category || "other",
      defaultPrice: String(item.defaultPrice ?? ""),
      sortOrder: String(item.sortOrder ?? 0),
    });

    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const saveTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      templateCode: templateForm.templateCode.trim(),
      packageName: templateForm.packageName.trim(),
      category: templateForm.category,
      description: templateForm.description.trim(),
      basePrice: Number(templateForm.basePrice),
      services: templateForm.servicesText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      deliverables: templateForm.deliverablesText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      sortOrder: Number(templateForm.sortOrder) || 0,
    };

    try {
      const url = formMode === "edit"
        ? `/api/final-packages/templates/${editingId}`
        : "/api/final-packages/templates";

      const response = await fetch(url, {
        method: formMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to save package template.")
        );
      }

      setSuccess("Package template saved successfully.");
      closeForm();
      await loadCatalogue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save template."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAddon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      addonCode: addonForm.addonCode.trim(),
      name: addonForm.name.trim(),
      description: addonForm.description.trim(),
      category: addonForm.category.trim(),
      defaultPrice: Number(addonForm.defaultPrice),
      sortOrder: Number(addonForm.sortOrder) || 0,
    };

    try {
      const url = formMode === "edit"
        ? `/api/final-packages/addons/${editingId}`
        : "/api/final-packages/addons";

      const response = await fetch(url, {
        method: formMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to save add-on."));
      }

      setSuccess("Add-on saved successfully.");
      closeForm();
      await loadCatalogue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save add-on.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplateStatus = async (item: PackageTemplate) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/final-packages/templates/${item._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !item.isActive }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to update template status.")
        );
      }

      setSuccess("Template status updated.");
      await loadCatalogue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update template."
      );
    }
  };

  const toggleAddonStatus = async (item: PackageAddon) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/final-packages/addons/${item._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !item.isActive }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to update add-on status.")
        );
      }

      setSuccess("Add-on status updated.");
      await loadCatalogue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update add-on."
      );
    }
  };

  const filteredTemplates = templates.filter((item) => {
    const text = `${item.packageName} ${item.templateCode} ${item.category}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const filteredAddons = addons.filter((item) => {
    const text = `${item.name} ${item.addonCode} ${item.category}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">
              Final Package Catalogue
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Manage reusable wedding package templates and additional services.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCatalogue}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Package Templates</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {templates.length}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {templates.filter((item) => item.isActive).length} active
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3">
              <Package className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Additional Services</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {addons.length}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {addons.filter((item) => item.isActive).length} active
              </p>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3">
              <Puzzle className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("templates");
              setSearch("");
              setFormOpen(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
              activeTab === "templates"
                ? "bg-amber-500 text-black font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Package className="h-4 w-4" />
            Templates
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("addons");
              setSearch("");
              setFormOpen(false);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
              activeTab === "addons"
                ? "bg-amber-500 text-black font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Puzzle className="h-4 w-4" />
            Add-ons
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search catalogue..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-amber-500 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={activeTab === "templates" ? openNewTemplate : openNewAddon}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Add {activeTab === "templates" ? "Template" : "Add-on"}
          </button>
        </div>
      </div>

      {/* Template form */}
      {formOpen && activeTab === "templates" && (
        <form
          onSubmit={saveTemplate}
          className="space-y-4 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {formMode === "create" ? "Create Package Template" : "Edit Package Template"}
            </h2>
            <button type="button" onClick={closeForm} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Template Code">
              <input required value={templateForm.templateCode} onChange={(e) => setTemplateForm({ ...templateForm, templateCode: e.target.value })} placeholder="BASIC-01" className={fieldClass} />
            </FormField>

            <FormField label="Package Name">
              <input required value={templateForm.packageName} onChange={(e) => setTemplateForm({ ...templateForm, packageName: e.target.value })} placeholder="Basic Package 01" className={fieldClass} />
            </FormField>

            <FormField label="Category">
              <select value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as PackageTemplate["category"] })} className={fieldClass}>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </FormField>

            <FormField label="Base Price (₹)">
              <input required type="number" min="0" step="1" value={templateForm.basePrice} onChange={(e) => setTemplateForm({ ...templateForm, basePrice: e.target.value })} placeholder="30000" className={fieldClass} />
            </FormField>

            <FormField label="Sort Order">
              <input type="number" value={templateForm.sortOrder} onChange={(e) => setTemplateForm({ ...templateForm, sortOrder: e.target.value })} className={fieldClass} />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description">
                <textarea rows={2} value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} className={fieldClass} />
              </FormField>
            </div>

            <FormField label="Services (one per line)">
              <textarea rows={6} value={templateForm.servicesText} onChange={(e) => setTemplateForm({ ...templateForm, servicesText: e.target.value })} placeholder={"Traditional Photography\nCandid Photography"} className={fieldClass} />
            </FormField>

            <FormField label="Deliverables (one per line)">
              <textarea rows={6} value={templateForm.deliverablesText} onChange={(e) => setTemplateForm({ ...templateForm, deliverablesText: e.target.value })} placeholder={"Premium Album\nEdited Photos"} className={fieldClass} />
            </FormField>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              Cancel
            </button>
            <button disabled={saving} type="submit" className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </form>
      )}

      {/* Add-on form */}
      {formOpen && activeTab === "addons" && (
        <form
          onSubmit={saveAddon}
          className="space-y-4 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {formMode === "create" ? "Create Add-on" : "Edit Add-on"}
            </h2>
            <button type="button" onClick={closeForm} className="text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Add-on Code">
              <input required value={addonForm.addonCode} onChange={(e) => setAddonForm({ ...addonForm, addonCode: e.target.value })} placeholder="ADD-01" className={fieldClass} />
            </FormField>

            <FormField label="Add-on Name">
              <input required value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} placeholder="Additional Photobook" className={fieldClass} />
            </FormField>

            <FormField label="Category">
              <input value={addonForm.category} onChange={(e) => setAddonForm({ ...addonForm, category: e.target.value })} placeholder="Album / Video / Event" className={fieldClass} />
            </FormField>

            <FormField label="Default Price (₹)">
              <input required type="number" min="0" step="1" value={addonForm.defaultPrice} onChange={(e) => setAddonForm({ ...addonForm, defaultPrice: e.target.value })} placeholder="25000" className={fieldClass} />
            </FormField>

            <FormField label="Sort Order">
              <input type="number" value={addonForm.sortOrder} onChange={(e) => setAddonForm({ ...addonForm, sortOrder: e.target.value })} className={fieldClass} />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description">
                <textarea rows={3} value={addonForm.description} onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })} className={fieldClass} />
              </FormField>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
              Cancel
            </button>
            <button disabled={saving} type="submit" className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
              {saving ? "Saving..." : "Save Add-on"}
            </button>
          </div>
        </form>
      )}

      {/* Catalogue list */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading catalogue...
        </div>
      ) : activeTab === "templates" ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="font-semibold text-white">Package Templates</h2>
            <p className="mt-1 text-xs text-zinc-500">
              These templates can be used when creating a new Final Package.
            </p>
          </div>

          {filteredTemplates.length === 0 ? (
            <EmptyState text="No package templates found." />
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredTemplates.map((item) => (
                <div key={item._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{item.packageName}</h3>
                      <StatusBadge active={item.isActive} />
                      <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.templateCode} · {item.services?.length || 0} services · {item.deliverables?.length || 0} deliverables
                    </p>
                    {item.description && (
                      <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <p className="text-lg font-bold text-amber-400">
                      {formatPrice(item.basePrice)}
                    </p>
                    <div className="flex gap-2">
                      <ActionButton label="Edit" onClick={() => openEditTemplate(item)}>
                        <Pencil className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton label={item.isActive ? "Deactivate" : "Activate"} onClick={() => toggleTemplateStatus(item)}>
                        <Power className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="font-semibold text-white">Additional Services / Add-ons</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Manage optional services that can be added to a Final Package.
            </p>
          </div>

          {filteredAddons.length === 0 ? (
            <EmptyState text="No add-ons found." />
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredAddons.map((item) => (
                <div key={item._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      <StatusBadge active={item.isActive} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.addonCode} · {item.category}
                    </p>
                    {item.description && (
                      <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                    <p className="text-lg font-bold text-amber-400">
                      {formatPrice(item.defaultPrice)}
                    </p>
                    <div className="flex gap-2">
                      <ActionButton label="Edit" onClick={() => openEditAddon(item)}>
                        <Pencil className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton label={item.isActive ? "Deactivate" : "Activate"} onClick={() => toggleAddonStatus(item)}>
                        <Power className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const fieldClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-700 text-zinc-400"
      }`}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:border-amber-500/50 hover:bg-zinc-800 hover:text-amber-400"
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-12 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}
