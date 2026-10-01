"use client";

import { useEffect, useState } from "react";

type PhotoSelectionEvent = {
  id: string;
  eventCode: string;
  eventName: string;
  clientName: string;
  totalPhotos: number;
  selectionLimit: number;
  status: "active" | "submitted" | "closed";
};

export default function PhotoSelectionSection() {
  const [events, setEvents] = useState<PhotoSelectionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectionLimit, setSelectionLimit] = useState("250");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/photo-selection/events",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error(
        "Failed to load photo selection events:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Photo Selection
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Create events and manage client photo selections.
          </p>
        </div>

        <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
            + Create Event
        </button>
      </div>

      {/* Loading */}
      {showCreateForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-semibold">
                Create Photo Selection Event
                </h3>

                <p className="mt-1 text-sm text-zinc-400">
                Create an event for your client to select photos.
                </p>
            </div>

            <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
                Cancel
            </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
            <div>
                <label className="mb-2 block text-sm text-zinc-300">
                Event Name
                </label>

                <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Jeevana Wedding"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm text-zinc-300">
                Event Code
                </label>

                <input
                type="text"
                value={eventCode}
                onChange={(e) =>
                    setEventCode(e.target.value.toUpperCase())
                }
                placeholder="JEEVANA2026"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white uppercase outline-none focus:border-amber-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm text-zinc-300">
                Client Name
                </label>

                <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jeevana"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm text-zinc-300">
                Selection Limit
                </label>

                <input
                type="number"
                min="1"
                value={selectionLimit}
                onChange={(e) => setSelectionLimit(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
            </div>
            </div>

            <div className="mt-6 flex justify-end">
            <button
                type="button"
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
            >
                Create Event
            </button>
            </div>
        </div>
        )}
      {loading && (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Loading events...
        </div>
      )}

      {/* Empty */}
      {!loading && events.length === 0 && (
        <div className="rounded-xl border p-10 text-center">
          <h3 className="text-lg font-medium">
            No Photo Selection Events
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Create your first event to start collecting
            client photo selections.
          </p>
        </div>
      )}

      {/* Events */}
      {!loading && events.length > 0 && (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {event.eventName}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.clientName}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md border px-2 py-1">
                      {event.eventCode}
                    </span>

                    <span className="rounded-md border px-2 py-1">
                      {event.totalPhotos} Photos
                    </span>

                    <span className="rounded-md border px-2 py-1">
                      Limit: {event.selectionLimit}
                    </span>

                    <span className="rounded-md border px-2 py-1">
                      {event.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Manage Event
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}