"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PhotoSelectionEvent = {
  id: string;
  eventCode: string;
  eventName: string;
  clientName: string;
  clientId: string | null;
  bookingId: string | null;
  folderId: string | null;
  totalPhotos: number;
  selectionLimit: number;
  status: "active" | "submitted" | "closed";
};

export default function PhotoSelectionManagePage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;

  const [event, setEvent] = useState<PhotoSelectionEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/photo-selection/events/${eventId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.error || "Failed to load event.");
        return;
      }

      setEvent(data.event);
    } catch (error) {
      console.error("Failed to load photo selection event:", error);
      alert("Failed to load event.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
            Loading event...
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() =>
              router.push("/admin?tab=photo_selection")
            }
            className="mb-6 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            ← Back to Photo Selection
          </button>

          <div className="rounded-xl border border-red-900 bg-red-950/30 p-8 text-center">
            Event not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        <button
          type="button"
          onClick={() =>
            router.push("/admin?tab=photo_selection")
          }
          className="mb-6 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          ← Back to Photo Selection
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold">
            {event.eventName}
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Manage client photo selection for this event.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Event Code
            </p>

            <p className="mt-2 font-mono text-lg font-semibold text-amber-400">
              {event.eventCode}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Client
            </p>

            <p className="mt-2 text-lg font-semibold">
              {event.clientName}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Status
            </p>

            <p className="mt-2 text-lg font-semibold capitalize">
              {event.status}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Total Photos
            </p>

            <p className="mt-2 text-lg font-semibold">
              {event.totalPhotos}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Selection Limit
            </p>

            <p className="mt-2 text-lg font-semibold">
              {event.selectionLimit}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              File Manager Folder
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              {event.folderId
                ? "Folder connected"
                : "No folder connected"}
            </p>
          </div>

        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Photos
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Connect an existing File Manager folder to this event.
          </p>

          <button
            type="button"
            className="mt-5 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Select File Manager Folder
          </button>
        </div>

      </div>
    </div>
  );
}