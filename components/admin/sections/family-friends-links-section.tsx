
"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Plus,
  RefreshCw,
  Link as LinkIcon,
  Users,
  ExternalLink,
  ShieldOff,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email?: string;
}

interface FamilyLink {
  id: string;
  clientId: string;
  client: { name: string; email?: string } | null;
  recipientName: string;
  driveUrl: string;
  token: string;
  status: "active" | "revoked";
  createdAt: string;
  revokedAt: string | null;
}

export default function FamilyFriendsLinksSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [links, setLinks] = useState<FamilyLink[]>([]);
  const [clientId, setClientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [clientResponse, linkResponse] = await Promise.all([
        fetch("/api/user/admin"),
        fetch("/api/family-friends-links"),
      ]);

      if (!clientResponse.ok || !linkResponse.ok) {
        throw new Error("Could not load clients or links. Check admin login and API errors.");
      }

      const clientData = await clientResponse.json();
      const linkData = await linkResponse.json();

      setClients(clientData.clients || []);
      setLinks(linkData.links || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    setGeneratedUrl("");

    try {
      const response = await fetch("/api/family-friends-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, recipientName, driveUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create link.");
      }

      setGeneratedUrl(data.link.url);
      setMessage("Link created successfully.");
      setRecipientName("");
      setDriveUrl("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create link.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied to clipboard.");
      setError("");
    } catch {
      setError("Copy failed. Open the link and copy it manually.");
    }
  }

  async function revokeLink(id: string) {
    if (!window.confirm("Revoke this link? It will no longer open the memories page.")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/family-friends-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not revoke link.");
      }

      setMessage("Link revoked successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke link.");
    }
  }

  const filteredLinks = links.filter((link) => {
    const text = [
      link.recipientName,
      link.client?.name || "",
      link.client?.email || "",
    ].join(" ").toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (statusFilter === "all" || link.status === statusFilter)
    );
  });

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Family & Friends Memories Links
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create an individual memories link for every friend or family member.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm hover:bg-zinc-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total links</p>
          <p className="text-3xl font-bold mt-2">{links.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Active links</p>
          <p className="text-3xl font-bold mt-2">
            {links.filter((link) => link.status === "active").length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Revoked links</p>
          <p className="text-3xl font-bold mt-2">
            {links.filter((link) => link.status === "revoked").length}
          </p>
        </div>
      </div>

      <form
        onSubmit={createLink}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Generate a new link</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm text-zinc-300">
            Select client
            <select
              required
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-white"
            >
              <option value="">Choose a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}{client.email ? ` — ${client.email}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-zinc-300">
            Friend or family member name
            <input
              required
              maxLength={100}
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              placeholder="e.g. Bride's Friend"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-white placeholder:text-zinc-600"
            />
          </label>
        </div>

        <label className="block text-sm text-zinc-300">
          Individual Google Drive folder URL
          <input
            required
            type="url"
            value={driveUrl}
            onChange={(event) => setDriveUrl(event.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-white placeholder:text-zinc-600"
          />
        </label>

        <button
          type="submit"
          disabled={saving || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          <LinkIcon className="h-4 w-4" />
          {saving ? "Generating..." : "Generate Memories Link"}
        </button>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {generatedUrl && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <p className="font-semibold text-amber-300">Your new sharing link</p>
          <p className="break-all text-sm text-zinc-300">{generatedUrl}</p>
          <button
            type="button"
            onClick={() => void copyLink(generatedUrl)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold">All sharing links</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search client or recipient"
              className="w-full sm:w-56 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-zinc-400">Loading links...</p>
        ) : filteredLinks.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">
            No sharing links found.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((link) => {
              const url = `${baseUrl}/family-memories/${link.token}`;

              return (
                <article
                  key={link.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{link.recipientName}</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        {link.client?.name || "Unknown client"}
                        {link.client?.email ? ` · ${link.client.email}` : ""}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Created: {new Date(link.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        link.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {link.status}
                    </span>
                  </div>

                  <p className="break-all text-xs text-zinc-500">{url}</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyLink(url)}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800"
                    >
                      <Copy className="h-4 w-4" />
                      Copy link
                    </button>

                    {link.status === "active" && (
                      <>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Preview
                        </a>

                        <button
                          type="button"
                          onClick={() => void revokeLink(link.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300 hover:bg-red-950/40"
                        >
                          <ShieldOff className="h-4 w-4" />
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
