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

type FileManagerFolder = {
  id: string;
  folderName: string;
  description: string;
  fileCount: number;
  coverImage: string | null;
  assignedClientName: string | null;
  assignedBookingNumber: string | null;
  assignedEventType: string | null;
};

export default function PhotoSelectionManagePage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;

  const [event, setEvent] = useState<PhotoSelectionEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const [folders, setFolders] = useState<FileManagerFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    loadEvent();
    loadFolders();
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

  async function loadFolders() {
    try {
        setLoadingFolders(true);

        const response = await fetch(
        "/api/file-manager/folders",
        {
            cache: "no-store",
        }
        );

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.error || "Failed to load folders."
        );
        }

        setFolders(data.folders || []);
    } catch (error) {
        console.error("Failed to load File Manager folders:", error);
        alert("Failed to load File Manager folders.");
    } finally {
        setLoadingFolders(false);
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
            <div className="mb-6">
                <h2 className="text-lg font-semibold">
                Select Photo Folder
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                Choose an existing folder from File Manager.
                Photos will not be uploaded again.
                </p>
            </div>

            {loadingFolders && (
                <div className="rounded-lg border border-zinc-800 p-6 text-center text-sm text-zinc-400">
                Loading File Manager folders...
                </div>
            )}

            {!loadingFolders && folders.length === 0 && (
                <div className="rounded-lg border border-zinc-800 p-6 text-center">
                <p className="text-sm text-zinc-400">
                    No File Manager folders found.
                </p>

                <button
                    type="button"
                    onClick={loadFolders}
                    className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
                >
                    Refresh Folders
                </button>
                </div>
            )}

            {!loadingFolders && folders.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {folders.map((folder) => (
                    <div
                    key={folder.id}
                    className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
                    >
                    {folder.coverImage ? (
                        <img
                        src={folder.coverImage}
                        alt={folder.folderName}
                        className="h-40 w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-40 items-center justify-center bg-zinc-900 text-sm text-zinc-600">
                        No Preview
                        </div>
                    )}

                    <div className="p-4">
                        <h3 className="truncate font-semibold text-white">
                        {folder.folderName}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400">
                        {folder.fileCount} photos
                        </p>

                        {folder.assignedClientName && (
                        <p className="mt-2 text-xs text-zinc-500">
                            Client: {folder.assignedClientName}
                        </p>
                        )}

                        {folder.assignedBookingNumber && (
                        <p className="mt-1 text-xs text-zinc-500">
                            Booking: {folder.assignedBookingNumber}
                        </p>
                        )}

                        <button
                        type="button"
                        className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
                        >
                        Connect This Folder
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>

      </div>
    </div>
  );
}