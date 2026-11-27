
"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
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
  Link,
  Copy,
  History,
  Ban,
  Trash2,
} from "lucide-react";


type TemplateItem = {
  name: string;
  description?: string;
  quantity: number;
};

type PackageTemplate = {
  _id: string;
  templateCode: string;
  packageName: string;
  category: "basic" | "standard" | "premium" | "vip";
  description: string;
  basePrice: number;
  services: TemplateItem[];
  deliverables: TemplateItem[];
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

type CatalogueShare = {
  id: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
};

type CatalogueLayout = {
  heroBackgroundImage: string;
  heroLogo: string;
  coupleImage: string;
  ribbonImage: string;
  flowerImage: string;
  addonsImage: string;
  paymentImage: string;
  termsImage: string;
  contactImage: string;
  showHero: boolean;
  showIntroduction: boolean;
  showPackages: boolean;
  showAddons: boolean;
  showPaymentTerms: boolean;
  showContact: boolean;
}; 

const defaultCatalogueLayout: CatalogueLayout = {
  heroBackgroundImage: "/images/wedding-hero-decoration.png",
  heroLogo: "/images/kutti-story-logo-white.png",
  coupleImage: "/images/wedding-catalogue-couple.png",
  ribbonImage: "/images/wedding-blue-ribbon.png",
  flowerImage: "/images/wedding-flower.png",
  addonsImage: "/images/additional-services-bride.png",
  paymentImage: "/images/payment-terms-couple.png",
  termsImage: "/images/terms-elephant-frame.png",
  contactImage: "/images/contact-paper-foliage.png",
  showHero: true,
  showIntroduction: true,
  showPackages: true,
  showAddons: true,
  showPaymentTerms: true,
  showContact: true,
};

type CatalogueTab = "all" | "templates" | "addons";
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

const fieldClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatTemplateItems(items: TemplateItem[] = []) {
  return items
    .map((item) => {
      if (typeof item === "string") return item;

      return [
        item.name || "",
        item.quantity ?? 1,
        item.description || "",
      ].join(" | ");
    })
    .join("\n");
}

function parseTemplateItems(text: string): TemplateItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());

      return {
        name: parts[0] || "",
        quantity: Math.max(0, Number(parts[1]) || 1),
        description: parts.slice(2).join(" | "),
      };
    })
    .filter((item) => item.name.length > 0);
}

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const result = data as { message?: string; error?: string };
    return result.message || result.error || fallback;
  }
  return fallback;
}

export default function FinalPackageCatalogueSection() {
  const [activeTab, setActiveTab] = useState<CatalogueTab>("all");
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [addons, setAddons] = useState<PackageAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareHistoryLoading, setShareHistoryLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareHistory, setShareHistory] = useState<CatalogueShare[]>([]);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [addonForm, setAddonForm] = useState(emptyAddon);
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);

  const [layoutForm, setLayoutForm] =
  useState<CatalogueLayout>(defaultCatalogueLayout);

  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutError, setLayoutError] = useState("");
  const [layoutSuccess, setLayoutSuccess] = useState("");

  useEffect(() => {
    if (!layoutEditorOpen) return;

    let cancelled = false;

    const loadLayout = async () => {
      setLayoutLoading(true);
      setLayoutError("");
      setLayoutSuccess("");

      try {
        const response = await fetch("/api/final-packages/settings");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load layout settings.");
        }

        if (!cancelled) {
          setLayoutForm({
            ...defaultCatalogueLayout,
            ...(result.settings?.layout || {}),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLayoutError(
            error instanceof Error ? error.message : "Unable to load layout settings."
          );
        }
      } finally {
        if (!cancelled) {
          setLayoutLoading(false);
        }
      }
    };

    void loadLayout();

    return () => {
      cancelled = true;
    };
  }, [layoutEditorOpen]);

  const saveLayout = async () => {
    setLayoutSaving(true);
    setLayoutError("");
    setLayoutSuccess("");

    try {
      const response = await fetch("/api/final-packages/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layout: layoutForm,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save layout settings.");
      }

      setLayoutSuccess("Page layout saved successfully.");
    } catch (error) {
      setLayoutError(
        error instanceof Error ? error.message : "Unable to save layout settings."
      );
    } finally {
      setLayoutSaving(false);
    }
  };

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [templateResponse, addonResponse] = await Promise.all([
        fetch("/api/final-packages/templates", { cache: "no-store" }),
        fetch("/api/final-packages/addons", { cache: "no-store" }),
      ]);

      const [templateData, addonData] = await Promise.all([
        templateResponse.json(),
        addonResponse.json(),
      ]);

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

      setAddons(
        Array.isArray(addonData.addons) ? addonData.addons : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load catalogue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogue();
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
    setAddonForm(emptyAddon);
    setActiveTab("templates");
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
        servicesText: formatTemplateItems(item.services || []),
        deliverablesText: formatTemplateItems(item.deliverables || []),
        sortOrder: String(item.sortOrder ?? 0),
    });

    setAddonForm(emptyAddon);
    setActiveTab("templates");
    setFormOpen(true);
    setError("");
    setSuccess("");
    };

  const openNewAddon = () => {
    setFormMode("create");
    setEditingId(null);
    setAddonForm(emptyAddon);
    setTemplateForm(emptyTemplate);
    setActiveTab("addons");
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

    setTemplateForm(emptyTemplate);
    setActiveTab("addons");
    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const saveTemplate = async (event: FormEvent<HTMLFormElement>) => {
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
      services: parseTemplateItems(templateForm.servicesText),
      deliverables: parseTemplateItems(templateForm.deliverablesText),
      sortOrder: Number(templateForm.sortOrder) || 0,
    };

    try {
      const response = await fetch(
        formMode === "edit"
          ? `/api/final-packages/templates/${editingId}`
          : "/api/final-packages/templates",
        {
          method: formMode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to save package template.")
        );
      }

      closeForm();
      setSuccess("Package template saved successfully.");
      await loadCatalogue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save template."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAddon = async (event: FormEvent<HTMLFormElement>) => {
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
      const response = await fetch(
        formMode === "edit"
          ? `/api/final-packages/addons/${editingId}`
          : "/api/final-packages/addons",
        {
          method: formMode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Unable to save add-on."));
      }

      closeForm();
      setSuccess("Add-on saved successfully.");
      await loadCatalogue();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save add-on."
      );
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

  const createCatalogueShare = async () => {
    setShareLoading(true);
    setShareError("");
    setShareSuccess("");
    setShareUrl("");

    try {
        const response = await fetch(
        "/api/final-packages/catalogue-share",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
        throw new Error(
            getErrorMessage(data, "Unable to create catalogue link.")
        );
        }

        setShareUrl(data.shareUrl);
        setShareSuccess("Your wedding catalogue link is ready.");
        await loadShareHistory();
    } catch (err) {
        setShareError(
        err instanceof Error ? err.message : "Unable to create link."
        );
    } finally {
        setShareLoading(false);
    }
    };

    const loadShareHistory = async () => {
    setShareHistoryLoading(true);
    setShareError("");

    try {
        const response = await fetch(
        "/api/final-packages/catalogue-share/history",
        { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
        throw new Error(
            getErrorMessage(data, "Unable to load share history.")
        );
        }

        setShareHistory(
        Array.isArray(data.shares) ? data.shares : []
        );
    } catch (err) {
        setShareError(
        err instanceof Error ? err.message : "Unable to load history."
        );
    } finally {
        setShareHistoryLoading(false);
    }
    };

    const revokeCatalogueShare = async (id: string) => {
    const confirmed = window.confirm(
        "Are you sure you want to revoke this catalogue link? Clients will no longer be able to open it."
    );

    if (!confirmed) return;

    setShareError("");
    setShareSuccess("");

    try {
        const response = await fetch(
          `/api/final-packages/catalogue-share/${id}`,
          { method: "PATCH" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
        throw new Error(
            getErrorMessage(data, "Unable to revoke catalogue link.")
        );
        }

        setShareSuccess("Catalogue link revoked successfully.");
        await loadShareHistory();
    } catch (err) {
        setShareError(
        err instanceof Error ? err.message : "Unable to revoke link."
        );
    }
    };

    const deleteCatalogueShare = async (id: string) => {
      const confirmed = window.confirm(
        "Permanently delete this catalogue link from history? This action cannot be undone."
      );

      if (!confirmed) return;

      setShareError("");
      setShareSuccess("");

      try {
        const response = await fetch(
          `/api/final-packages/catalogue-share/${id}`,
          { method: "DELETE" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            getErrorMessage(data, "Unable to delete catalogue link.")
          );
        }

        setShareSuccess("Catalogue link permanently deleted.");
        await loadShareHistory();
      } catch (err) {
        setShareError(
          err instanceof Error ? err.message : "Unable to delete link."
        );
      }
    };

    const copyHistoryCatalogueShare = async (id: string) => {
      setShareError("");
      setShareSuccess("");

      try {
        const response = await fetch(
          `/api/final-packages/catalogue-share/${id}/copy`,
          { method: "GET", cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.shareUrl) {
          throw new Error(
            getErrorMessage(data, "Unable to retrieve catalogue link.")
          );
        }

        await navigator.clipboard.writeText(data.shareUrl);

        setShareSuccess("Catalogue link copied successfully.");
      } catch (err) {
        setShareError(
          err instanceof Error ? err.message : "Unable to copy catalogue link."
        );
      }
    };

    const copyCatalogueShare = async () => {
    if (!shareUrl) return;

    try {
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess("Catalogue link copied successfully.");
    } catch {
        setShareError("Unable to copy. Please copy the link manually.");
    }
    };

  const query = search.trim().toLowerCase();

  const filteredTemplates = templates.filter((item) =>
    `${item.packageName} ${item.templateCode} ${item.category}`
      .toLowerCase()
      .includes(query)
  );

  const filteredAddons = addons.filter((item) =>
    `${item.name} ${item.addonCode} ${item.category}`
      .toLowerCase()
      .includes(query)
  );

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLayoutEditorOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20"
          >
            <Pencil className="h-4 w-4" />
            Edit Page Layout
          </button>

          <button
            type="button"
            onClick={() => void loadCatalogue()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ALERTS */}
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

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Package Templates"
          count={templates.length}
          active={templates.filter((item) => item.isActive).length}
          icon={<Package className="h-6 w-6 text-amber-400" />}
          iconBg="bg-amber-500/10"
        />

        <SummaryCard
          title="Additional Services"
          count={addons.length}
          active={addons.filter((item) => item.isActive).length}
          icon={<Puzzle className="h-6 w-6 text-blue-400" />}
          iconBg="bg-blue-500/10"
        />
      </div>

      {/* PRIVATE WEDDING CATALOGUE SHARING */}
        <section className="space-y-4 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
            <div className="flex items-center gap-2">
                <Link className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">
                Private Wedding Catalogue Sharing
                </h2>
            </div>

            <p className="mt-2 text-sm text-zinc-400">
                Generate a private link to share all active 2026 wedding packages
                and add-ons with your clients.
            </p>
            </div>

            <div className="flex flex-wrap gap-2">
            <button
                type="button"
                onClick={() => void createCatalogueShare()}
                disabled={shareLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
            >
                <Link className="h-4 w-4" />
                {shareLoading ? "Generating..." : "Generate Share Link"}
            </button>

            <button
                type="button"
                onClick={() => void loadShareHistory()}
                disabled={shareHistoryLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800"
            >
                <History className="h-4 w-4" />
                {shareHistoryLoading ? "Loading..." : "Link History"}
            </button>
            </div>
        </div>

        {shareError && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            {shareError}
            </p>
        )}

        {shareSuccess && (
            <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {shareSuccess}
            </p>
        )}

        {shareUrl && (
            <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-zinc-950 p-4">
            <p className="text-sm font-medium text-emerald-400">
                Your private catalogue link is ready
            </p>

            <input
                readOnly
                value={shareUrl}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"
                onFocus={(event) => event.target.select()}
            />

            <button
                type="button"
                onClick={() => void copyCatalogueShare()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
                <Copy className="h-4 w-4" />
                Copy Link
            </button>

            <p className="text-xs text-zinc-500">
                Save this link now. For security, the complete link cannot be
                recovered from history later.
            </p>
            </div>
        )}

        {shareHistory.length > 0 && (
            <div className="space-y-3 border-t border-zinc-800 pt-5">
            <h3 className="font-semibold text-white">
                Previously Generated Links
            </h3>

            {shareHistory.map((share) => (
                <div
                key={share.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center"
                >
                <div>
                    <p className="text-sm font-medium text-white">
                    Created: {new Date(share.createdAt).toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                    Expires:{" "}
                    {share.expiresAt
                        ? new Date(share.expiresAt).toLocaleString("en-IN")
                        : "Never"}
                    </p>

                    <span
                    className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${
                        share.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : share.status === "expired"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                    }`}
                    >
                    {share.status.toUpperCase()}
                    </span>
                </div>    

                  <div className="flex flex-wrap items-center gap-2">
                    {share.status === "active" && (
                      <>
                        <button
                          type="button"
                          onClick={() => void copyHistoryCatalogueShare(share.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </button>

                        <button
                          type="button"
                          onClick={() => void revokeCatalogueShare(share.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 transition hover:bg-amber-500/20"
                        >
                          <Ban className="h-4 w-4" />
                          Revoke Link
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => void deleteCatalogueShare(share.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                  
                </div>
            ))}
            </div>
        )}
        </section>

      {/* TABS AND SEARCH */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <TabButton
            active={activeTab === "all"}
            onClick={() => {
              setActiveTab("all");
              setFormOpen(false);
              setSearch("");
            }}
          >
            All
          </TabButton>

          <TabButton
            active={activeTab === "templates"}
            onClick={() => {
              setActiveTab("templates");
              setFormOpen(false);
              setSearch("");
            }}
          >
            <Package className="h-4 w-4" />
            Templates
          </TabButton>

          <TabButton
            active={activeTab === "addons"}
            onClick={() => {
              setActiveTab("addons");
              setFormOpen(false);
              setSearch("");
            }}
          >
            <Puzzle className="h-4 w-4" />
            Add-ons
          </TabButton>
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

          {activeTab === "all" ? (
            <>
              <button
                type="button"
                onClick={openNewTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                Add Template
              </button>

              <button
                type="button"
                onClick={openNewAddon}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/10"
              >
                <Plus className="h-4 w-4" />
                Add Add-on
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={
                activeTab === "templates"
                  ? openNewTemplate
                  : openNewAddon
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              Add {activeTab === "templates" ? "Template" : "Add-on"}
            </button>
          )}
        </div>
      </div>

      {/* TEMPLATE FORM */}
      {formOpen && activeTab === "templates" && (
        <form
          onSubmit={saveTemplate}
          className="space-y-4 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5"
        >
          <FormHeader
            title={
              formMode === "create"
                ? "Create Package Template"
                : "Edit Package Template"
            }
            onClose={closeForm}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Template Code">
              <input
                required
                value={templateForm.templateCode}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    templateCode: e.target.value,
                  })
                }
                placeholder="BASIC-01"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Package Name">
              <input
                required
                value={templateForm.packageName}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    packageName: e.target.value,
                  })
                }
                placeholder="Basic Package 01"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Category">
              <select
                value={templateForm.category}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    category: e.target.value as PackageTemplate["category"],
                  })
                }
                className={fieldClass}
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </FormField>

            <FormField label="Base Price (₹)">
              <input
                required
                type="number"
                min="0"
                step="1"
                value={templateForm.basePrice}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    basePrice: e.target.value,
                  })
                }
                placeholder="30000"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Sort Order">
              <input
                type="number"
                value={templateForm.sortOrder}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    sortOrder: e.target.value,
                  })
                }
                className={fieldClass}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description">
                <textarea
                  rows={2}
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      description: e.target.value,
                    })
                  }
                  className={fieldClass}
                />
              </FormField>
            </div>

            <FormField label="Services (one per line)">
              <textarea
                rows={6}
                value={templateForm.servicesText}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    servicesText: e.target.value,
                  })
                }
                placeholder={"Traditional Photography\nCandid Photography"}
                className={fieldClass}
              />
            </FormField>

            <FormField label="Deliverables (one per line)">
              <textarea
                rows={6}
                value={templateForm.deliverablesText}
                onChange={(e) =>
                  setTemplateForm({
                    ...templateForm,
                    deliverablesText: e.target.value,
                  })
                }
                placeholder={"Premium Album\nEdited Photos"}
                className={fieldClass}
              />
            </FormField>
          </div>

          <FormActions
            saving={saving}
            label="Template"
            onCancel={closeForm}
          />
        </form>
      )}

      {/* ADD-ON FORM */}
      {formOpen && activeTab === "addons" && (
        <form
          onSubmit={saveAddon}
          className="space-y-4 rounded-2xl border border-amber-500/30 bg-zinc-900 p-5"
        >
          <FormHeader
            title={formMode === "create" ? "Create Add-on" : "Edit Add-on"}
            onClose={closeForm}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Add-on Code">
              <input
                required
                value={addonForm.addonCode}
                onChange={(e) =>
                  setAddonForm({
                    ...addonForm,
                    addonCode: e.target.value,
                  })
                }
                placeholder="ADD-01"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Add-on Name">
              <input
                required
                value={addonForm.name}
                onChange={(e) =>
                  setAddonForm({
                    ...addonForm,
                    name: e.target.value,
                  })
                }
                placeholder="Additional Photobook"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Category">
              <input
                value={addonForm.category}
                onChange={(e) =>
                  setAddonForm({
                    ...addonForm,
                    category: e.target.value,
                  })
                }
                placeholder="Album / Video / Event"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Default Price (₹)">
              <input
                required
                type="number"
                min="0"
                step="1"
                value={addonForm.defaultPrice}
                onChange={(e) =>
                  setAddonForm({
                    ...addonForm,
                    defaultPrice: e.target.value,
                  })
                }
                placeholder="25000"
                className={fieldClass}
              />
            </FormField>

            <FormField label="Sort Order">
              <input
                type="number"
                value={addonForm.sortOrder}
                onChange={(e) =>
                  setAddonForm({
                    ...addonForm,
                    sortOrder: e.target.value,
                  })
                }
                className={fieldClass}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Description">
                <textarea
                  rows={3}
                  value={addonForm.description}
                  onChange={(e) =>
                    setAddonForm({
                      ...addonForm,
                      description: e.target.value,
                    })
                  }
                  className={fieldClass}
                />
              </FormField>
            </div>
          </div>

          <FormActions
            saving={saving}
            label="Add-on"
            onCancel={closeForm}
          />
        </form>
      )}

      {/* CATALOGUE CONTENT */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading catalogue...
        </div>
      ) : (
        <div className="space-y-6">
          {/* PACKAGE TEMPLATES */}
          {(activeTab === "all" || activeTab === "templates") && (
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-white">
                    Package Templates
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {filteredTemplates.length} package templates
                  </p>
                </div>
                <Package className="h-5 w-5 text-amber-400" />
              </div>

              {filteredTemplates.length === 0 ? (
                <EmptyState text="No package templates found." />
              ) : (
                <div className="divide-y divide-zinc-800">
                  {filteredTemplates.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {item.packageName}
                          </h3>
                          <StatusBadge active={item.isActive} />
                          <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] uppercase text-zinc-400">
                            {item.category}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          {item.templateCode} · {item.services?.length || 0} services · {item.deliverables?.length || 0} deliverables
                        </p>

                        {item.description && (
                          <p className="mt-2 text-sm text-zinc-400">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                        <p className="text-lg font-bold text-amber-400">
                          {formatPrice(item.basePrice)}
                        </p>

                        <div className="flex gap-2">
                          <ActionButton
                            label="Edit"
                            onClick={() => openEditTemplate(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            label={item.isActive ? "Deactivate" : "Activate"}
                            onClick={() => void toggleTemplateStatus(item)}
                          >
                            <Power className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ADD-ONS */}
          {(activeTab === "all" || activeTab === "addons") && (
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-white">
                    Additional Services / Add-ons
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {filteredAddons.length} additional services
                  </p>
                </div>
                <Puzzle className="h-5 w-5 text-blue-400" />
              </div>

              {filteredAddons.length === 0 ? (
                <EmptyState text="No add-ons found." />
              ) : (
                <div className="divide-y divide-zinc-800">
                  {filteredAddons.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {item.name}
                          </h3>
                          <StatusBadge active={item.isActive} />
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          {item.addonCode} · {item.category}
                        </p>

                        {item.description && (
                          <p className="mt-2 text-sm text-zinc-400">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                        <p className="text-lg font-bold text-amber-400">
                          {formatPrice(item.defaultPrice)}
                        </p>

                        <div className="flex gap-2">
                          <ActionButton
                            label="Edit"
                            onClick={() => openEditAddon(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            label={item.isActive ? "Deactivate" : "Activate"}
                            onClick={() => void toggleAddonStatus(item)}
                          >
                            <Power className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
          {layoutEditorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    Edit Page Layout
                  </h2>

                  <button
                    type="button"
                    onClick={() => setLayoutEditorOpen(false)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="mt-2 text-sm text-zinc-400">
                  Customize catalogue images and section visibility.
                </p>

                <div className="mt-6 grid gap-4">
                  <FormField label="Hero Background Image">
                    <input
                      type="text"
                      value={layoutForm.heroBackgroundImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          heroBackgroundImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/wedding-hero-decoration.png"
                    />
                  </FormField>

                  <FormField label="Hero Logo">
                    <input
                      type="text"
                      value={layoutForm.heroLogo}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          heroLogo: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/kutti-story-logo-white.png"
                    />
                  </FormField>

                  <FormField label="Couple Image">
                    <input
                      type="text"
                      value={layoutForm.coupleImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          coupleImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/wedding-catalogue-couple.png"
                    />
                  </FormField>

                  <FormField label="Ribbon Image">
                    <input
                      type="text"
                      value={layoutForm.ribbonImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          ribbonImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/wedding-blue-ribbon.png"
                    />
                  </FormField>

                  <FormField label="Flower Image">
                    <input
                      type="text"
                      value={layoutForm.flowerImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          flowerImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/wedding-flower.png"
                    />
                  </FormField>

                  <FormField label="Add-ons Image">
                    <input
                      type="text"
                      value={layoutForm.addonsImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          addonsImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/additional-services-bride.png"
                    />
                  </FormField>

                  <FormField label="Payment Terms Image">
                    <input
                      type="text"
                      value={layoutForm.paymentImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          paymentImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/payment-terms-couple.png"
                    />
                  </FormField>

                  <FormField label="Terms & Conditions Image">
                    <input
                      type="text"
                      value={layoutForm.termsImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          termsImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/terms-elephant-frame.png"
                    />
                  </FormField>

                  <FormField label="Contact Image">
                    <input
                      type="text"
                      value={layoutForm.contactImage}
                      onChange={(e) =>
                        setLayoutForm((prev) => ({
                          ...prev,
                          contactImage: e.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="/images/contact-paper-foliage.png"
                    />
                  </FormField>

                  <div className="mt-6 border-t border-zinc-700 pt-5">
                    <h3 className="mb-4 text-sm font-semibold text-white">
                      Section Visibility
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {([
                        ["showHero", "Hero Section"],
                        ["showIntroduction", "Introduction"],
                        ["showPackages", "Wedding Packages"],
                        ["showAddons", "Additional Services"],
                        ["showPaymentTerms", "Payment Terms"],
                        ["showContact", "Contact Section"],
                      ] as const).map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-300"
                        >
                          <input
                            type="checkbox"
                            checked={layoutForm[key]}
                            onChange={(e) =>
                              setLayoutForm((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 accent-amber-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setLayoutEditorOpen(false)}
                      className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveLayout()}
                      disabled={layoutSaving || layoutLoading}
                      className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
                    >
                      {layoutSaving ? "Saving..." : "Save Layout"}
                    </button>
                  </div>
                </div>

                {layoutLoading && (
                  <p className="mt-6 text-sm text-amber-400">
                    Loading layout settings...
                  </p>
                )}

                {layoutError && (
                  <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                    {layoutError}
                  </p>
                )}

                {layoutSuccess && (
                  <p className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
                    {layoutSuccess}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

/* REUSABLE COMPONENTS */

function SummaryCard({
  title,
  count,
  active,
  icon,
  iconBg,
}: {
  title: string;
  count: number;
  active: number;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{count}</p>
          <p className="mt-1 text-xs text-zinc-500">{active} active</p>
        </div>

        <div className={`rounded-xl p-3 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
        active
          ? "bg-amber-500 font-semibold text-black"
          : "text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function FormHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="text-zinc-400 hover:text-white"
        aria-label="Close form"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function FormActions({
  saving,
  label,
  onCancel,
}: {
  saving: boolean;
  label: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        Cancel
      </button>

      <button
        disabled={saving}
        type="submit"
        className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
      >
        {saving ? "Saving..." : `Save ${label}`}
      </button>
    </div>
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
  children: ReactNode;
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
