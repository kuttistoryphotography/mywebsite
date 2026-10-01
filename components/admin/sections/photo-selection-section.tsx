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
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Create Event
        </button>
      </div>

      {/* Loading */}
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